<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BookingServiceTest extends TestCase
{
    use RefreshDatabase;

    private BookingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BookingService;
    }

    // ─── createBooking ────────────────────────────────────────────────────────

    #[Test]
    public function create_booking_generates_booking_reference_with_bk_g_prefix(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        $booking = $this->service->createBooking([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'customer_name' => 'テスト 太郎',
            'customer_email' => 'test@example.com',
            'customer_phone' => '090-0000-0000',
            'status' => 'confirmed',
        ]);

        $this->assertDatabaseHas('bookings', ['id' => $booking->id]);
        $this->assertStringStartsWith('BKG-', $booking->booking_reference);
    }

    #[Test]
    public function create_booking_retries_on_unique_constraint_violation(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        // 1回目で衝突させるための参照番号を事前に作成
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-AAAAAAAA',
        ]);

        $calls = 0;
        Str::createRandomStringsUsing(function () use (&$calls) {
            $calls++;

            return $calls === 1 ? 'AAAAAAAA' : 'BBBBBBBB';
        });

        try {
            $booking = $this->service->createBooking([
                'staff_id' => $staff->id,
                'menu_id' => $menu->id,
                'start_time' => '2024-06-01 11:00:00',
                'end_time' => '2024-06-01 12:00:00',
                'customer_name' => 'テスト 次郎',
                'customer_email' => 'test2@example.com',
                'customer_phone' => '090-0000-0001',
                'status' => 'confirmed',
            ]);

            $this->assertSame('BKG-BBBBBBBB', $booking->booking_reference);
            $this->assertSame(2, $calls); // 2回試行されたことを確認
        } finally {
            Str::createRandomStringsNormally();
        }
    }

    #[Test]
    public function create_booking_throws_runtime_exception_after_five_consecutive_violations(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        // 常に衝突する参照番号を事前に作成
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-AAAAAAAA',
        ]);

        Str::createRandomStringsUsing(fn () => 'AAAAAAAA');

        try {
            $this->expectException(\RuntimeException::class);

            $this->service->createBooking([
                'staff_id' => $staff->id,
                'menu_id' => $menu->id,
                'start_time' => '2024-06-01 11:00:00',
                'end_time' => '2024-06-01 12:00:00',
                'customer_name' => 'テスト 次郎',
                'customer_email' => 'test2@example.com',
                'customer_phone' => '090-0000-0001',
                'status' => 'confirmed',
            ]);
        } finally {
            Str::createRandomStringsNormally();
        }
    }

    // ─── getBookingsOnDate ────────────────────────────────────────────────────

    #[Test]
    public function get_bookings_on_date_returns_non_cancelled_bookings_on_target_date(): void
    {
        $targetDate = Carbon::parse('2024-06-01');
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);
        // キャンセル済みは除外されるべき
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 11:00:00',
            'end_time' => '2024-06-01 12:00:00',
            'status' => 'cancelled',
        ]);

        $results = $this->service->getBookingsOnDate($targetDate);

        $this->assertCount(1, $results);
        $this->assertEquals('2024-06-01 10:00:00', $results->first()->start_time->format('Y-m-d H:i:s'));
    }

    #[Test]
    public function get_bookings_on_date_filters_by_specified_staff_ids(): void
    {
        $targetDate = Carbon::parse('2024-06-01');
        $staffA = Staff::factory()->create();
        $staffB = Staff::factory()->create();
        $menu = Menu::factory()->create();

        Booking::factory()->create([
            'staff_id' => $staffA->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);
        Booking::factory()->create([
            'staff_id' => $staffB->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 11:00:00',
            'end_time' => '2024-06-01 12:00:00',
            'status' => 'confirmed',
        ]);

        // staffA のみ対象に絞る
        $results = $this->service->getBookingsOnDate($targetDate, [$staffA->id]);

        $this->assertCount(1, $results);
        $this->assertEquals($staffA->id, $results->first()->staff_id);
    }

    #[Test]
    public function get_bookings_on_date_excludes_bookings_outside_target_date(): void
    {
        $targetDate = Carbon::parse('2024-06-01');
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        // 前日の予約（対象外）
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-05-31 10:00:00',
            'end_time' => '2024-05-31 11:00:00',
            'status' => 'confirmed',
        ]);

        $results = $this->service->getBookingsOnDate($targetDate);

        $this->assertCount(0, $results);
    }

    #[Test]
    public function get_bookings_on_date_returns_all_when_no_staff_ids_given(): void
    {
        $targetDate = Carbon::parse('2024-06-01');
        $staffA = Staff::factory()->create();
        $staffB = Staff::factory()->create();
        $menu = Menu::factory()->create();

        Booking::factory()->create([
            'staff_id' => $staffA->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);
        Booking::factory()->create([
            'staff_id' => $staffB->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 11:00:00',
            'end_time' => '2024-06-01 12:00:00',
            'status' => 'confirmed',
        ]);

        // staffIds を渡さない → 全スタッフの予約を返す
        $results = $this->service->getBookingsOnDate($targetDate);

        $this->assertCount(2, $results);
    }
}
