<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Menu;
use App\Models\Setting;
use App\Models\Staff;
use App\Services\BookingService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
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

    // ─── calculateAvailableSlots ──────────────────────────────────────────────

    #[Test]
    public function calculate_available_slots_returns_slots_within_open_and_close_time(): void
    {
        $date = Carbon::parse('2024-06-01');
        $settings = new Setting([
            'open_time' => '10:00:00',
            'close_time' => '11:30:00',
            'booking_deadline_type' => 'date_based',
        ]);

        // 10:00（終了11:00）と10:30（終了11:30）の2スロットが収まる
        $slots = $this->service->calculateAvailableSlots($date, 60, $settings, 1, new EloquentCollection);

        $this->assertSame(['10:00', '10:30'], $slots);
    }

    #[Test]
    public function calculate_available_slots_excludes_slot_when_all_staffs_are_booked(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        $booking = Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);

        $date = Carbon::parse('2024-06-01');
        $settings = new Setting([
            'open_time' => '10:00:00',
            'close_time' => '12:00:00',
            'booking_deadline_type' => 'date_based',
        ]);

        // staffCount=1 かつ 10:00-11:00 が予約済み → 10:00・10:30 は除外、11:00 のみ返る
        $slots = $this->service->calculateAvailableSlots($date, 60, $settings, 1, new EloquentCollection([$booking]));

        $this->assertSame(['11:00'], $slots);
    }

    #[Test]
    public function calculate_available_slots_allows_slot_when_overlapping_count_is_less_than_staff_count(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        $booking = Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);

        $date = Carbon::parse('2024-06-01');
        $settings = new Setting([
            'open_time' => '10:00:00',
            'close_time' => '11:00:00',
            'booking_deadline_type' => 'date_based',
        ]);

        // staffCount=2 なので重複1件でもスロットは空いている
        $slots = $this->service->calculateAvailableSlots($date, 60, $settings, 2, new EloquentCollection([$booking]));

        $this->assertSame(['10:00'], $slots);
    }

    #[Test]
    public function calculate_available_slots_time_based_excludes_past_slots(): void
    {
        // 過去日を指定すると全スロットが締切超過と判定され除外される
        $date = Carbon::parse('2020-01-01');
        $settings = new Setting([
            'open_time' => '10:00:00',
            'close_time' => '11:00:00',
            'booking_deadline_type' => 'time_based',
            'booking_deadline_hours' => 2,
        ]);

        $slots = $this->service->calculateAvailableSlots($date, 60, $settings, 1, new EloquentCollection);

        $this->assertSame([], $slots);
    }

    // ─── isBookingDeadlinePassed ──────────────────────────────────────────────

    #[Test]
    public function is_booking_deadline_passed_returns_false_when_within_deadline(): void
    {
        $settings = new Setting([
            'booking_deadline_days' => 1,
            'booking_deadline_time' => '17:00:00',
        ]);

        // 十分先の日付では期限はまだ来ていない
        $result = $this->service->isBookingDeadlinePassed(Carbon::parse('2099-12-31'), $settings);

        $this->assertFalse($result);
    }

    #[Test]
    public function is_booking_deadline_passed_returns_true_when_past_deadline(): void
    {
        $settings = new Setting([
            'booking_deadline_days' => 1,
            'booking_deadline_time' => '17:00:00',
        ]);

        // 昨日の予約は確実に期限切れ
        $result = $this->service->isBookingDeadlinePassed(Carbon::yesterday(), $settings);

        $this->assertTrue($result);
    }

    // ─── isSlotWithinDeadline ─────────────────────────────────────────────────

    #[Test]
    public function is_slot_within_deadline_returns_true_when_slot_is_far_enough_ahead(): void
    {
        $settings = new Setting(['booking_deadline_hours' => 2]);

        $result = $this->service->isSlotWithinDeadline(Carbon::parse('2099-12-31 10:00:00'), $settings);

        $this->assertTrue($result);
    }

    #[Test]
    public function is_slot_within_deadline_returns_false_when_slot_is_within_deadline_hours(): void
    {
        $settings = new Setting(['booking_deadline_hours' => 2]);

        // 1時間後のスロットは締切2時間前を過ぎているため受付不可
        $result = $this->service->isSlotWithinDeadline(Carbon::now()->addHour(), $settings);

        $this->assertFalse($result);
    }

    // ─── assignStaff ─────────────────────────────────────────────────────────

    #[Test]
    public function assign_staff_returns_first_staff_without_overlapping_booking(): void
    {
        $staffA = Staff::factory()->create();
        $staffB = Staff::factory()->create();
        $menu = Menu::factory()->create();

        // staffA には重複予約あり、staffB には重複予約なし
        $overlappingBooking = Booking::factory()->create([
            'staff_id' => $staffA->id,
            'menu_id' => $menu->id,
            'status' => 'confirmed',
        ]);

        $assigned = $this->service->assignStaff(
            new EloquentCollection([$staffA, $staffB]),
            new EloquentCollection([$overlappingBooking])
        );

        $this->assertSame($staffB->id, $assigned->id);
    }

    #[Test]
    public function assign_staff_throws_exception_when_no_staff_is_available(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        $overlappingBooking = Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'status' => 'confirmed',
        ]);

        $this->expectException(\Exception::class);

        $this->service->assignStaff(new EloquentCollection([$staff]), new EloquentCollection([$overlappingBooking]));
    }

    // ─── findOverlappingBookingsByStaffs ──────────────────────────────────────

    #[Test]
    public function find_overlapping_bookings_returns_booking_that_overlaps_with_range(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'confirmed',
        ]);

        $results = $this->service->findOverlappingBookingsByStaffs(
            new EloquentCollection([$staff]),
            Carbon::parse('2024-06-01 10:30:00'),
            Carbon::parse('2024-06-01 11:30:00')
        );

        $this->assertCount(1, $results);
    }

    #[Test]
    public function find_overlapping_bookings_excludes_non_overlapping_booking(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        // 11:00-12:00 の予約は 10:00-11:00 の範囲と隣接するだけで重複しない
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 11:00:00',
            'end_time' => '2024-06-01 12:00:00',
            'status' => 'confirmed',
        ]);

        $results = $this->service->findOverlappingBookingsByStaffs(
            new EloquentCollection([$staff]),
            Carbon::parse('2024-06-01 10:00:00'),
            Carbon::parse('2024-06-01 11:00:00')
        );

        $this->assertCount(0, $results);
    }

    #[Test]
    public function find_overlapping_bookings_excludes_cancelled_booking(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();

        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'start_time' => '2024-06-01 10:00:00',
            'end_time' => '2024-06-01 11:00:00',
            'status' => 'cancelled',
        ]);

        $results = $this->service->findOverlappingBookingsByStaffs(
            new EloquentCollection([$staff]),
            Carbon::parse('2024-06-01 10:30:00'),
            Carbon::parse('2024-06-01 11:30:00')
        );

        $this->assertCount(0, $results);
    }
}
