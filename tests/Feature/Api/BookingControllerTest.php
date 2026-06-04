<?php

namespace Tests\Feature\Api;

use App\Contracts\StripeServiceInterface;
use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff;
use App\Models\StaffSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BookingControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();
        $this->withoutMiddleware(ThrottleRequests::class);
        // StripeClient の初期化を回避するためコンテナのバインドをモックで置き換える
        $this->mock(StripeServiceInterface::class);
    }

    private function createStaffWithSchedule(): Staff
    {
        $staff = Staff::factory()->create(['is_active' => true]);
        StaffSchedule::create([
            'staff_id' => $staff->id,
            'monday' => true, 'tuesday' => true, 'wednesday' => true,
            'thursday' => true, 'friday' => true, 'saturday' => true, 'sunday' => true,
        ]);

        return $staff;
    }

    // ─── POST /api/bookings ───────────────────────────────────────────────────

    #[Test]
    public function store_creates_booking_and_returns_201(): void
    {
        $this->createStaffWithSchedule();
        $menu = Menu::factory()->create(['duration_minutes' => 60]);
        $startTime = Carbon::now()->addDays(7)->setTime(10, 0, 0);

        $response = $this->postJson('/api/bookings', [
            'menu_id' => $menu->id,
            'start_time' => $startTime->format('Y-m-d H:i:s'),
            'customer_name' => 'テスト 太郎',
            'customer_email' => 'test@example.com',
            'customer_phone' => '090-0000-0000',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'booking' => ['booking_reference', 'status']]);

        $this->assertDatabaseHas('bookings', [
            'customer_email' => 'test@example.com',
            'status' => 'confirmed',
        ]);
    }

    #[Test]
    public function store_returns_422_when_required_fields_are_missing(): void
    {
        $response = $this->postJson('/api/bookings', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['menu_id', 'start_time', 'customer_name', 'customer_email', 'customer_phone']);
    }

    #[Test]
    public function store_returns_409_when_no_staff_is_available(): void
    {
        // スタッフを作成しない → getAvailableStaffs が空を返す → 409
        $menu = Menu::factory()->create(['duration_minutes' => 60]);

        $response = $this->postJson('/api/bookings', [
            'menu_id' => $menu->id,
            'start_time' => Carbon::now()->addDays(7)->setTime(10, 0, 0)->format('Y-m-d H:i:s'),
            'customer_name' => 'テスト 太郎',
            'customer_email' => 'test@example.com',
            'customer_phone' => '090-0000-0000',
        ]);

        $response->assertStatus(409);
    }

    // ─── POST /api/bookings/search ────────────────────────────────────────────

    #[Test]
    public function search_returns_booking_when_reference_and_email_match(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();
        $booking = Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-TEST1234',
            'customer_email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/bookings/search', [
            'booking_reference' => 'BKG-TEST1234',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('booking.id', $booking->id)
            ->assertJsonPath('booking.booking_reference', 'BKG-TEST1234');
    }

    #[Test]
    public function search_returns_404_when_no_matching_booking(): void
    {
        $response = $this->postJson('/api/bookings/search', [
            'booking_reference' => 'BKG-NOTFOUND',
            'email' => 'nobody@example.com',
        ]);

        $response->assertStatus(404);
    }

    // ─── DELETE /api/bookings/{reference} ─────────────────────────────────────

    #[Test]
    public function cancel_sets_booking_status_to_cancelled_and_returns_200(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();
        $booking = Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-CANCEL01',
            'customer_email' => 'test@example.com',
            'start_time' => Carbon::now()->addDays(7),
            'end_time' => Carbon::now()->addDays(7)->addHour(),
            'status' => 'confirmed',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->deleteJson('/api/bookings/BKG-CANCEL01', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'cancelled']);
    }

    #[Test]
    public function cancel_returns_404_when_email_does_not_match(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-CANCEL02',
            'customer_email' => 'real@example.com',
        ]);

        $response = $this->deleteJson('/api/bookings/BKG-CANCEL02', [
            'email' => 'wrong@example.com',
        ]);

        $response->assertStatus(404);
    }

    #[Test]
    public function cancel_returns_400_when_booking_is_already_cancelled(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-CANCEL03',
            'customer_email' => 'test@example.com',
            'status' => 'cancelled',
        ]);

        $response = $this->deleteJson('/api/bookings/BKG-CANCEL03', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(400);
    }

    #[Test]
    public function cancel_returns_403_when_cancel_deadline_has_passed(): void
    {
        $staff = Staff::factory()->create();
        $menu = Menu::factory()->create();
        // start_time を12時間後に設定 → デフォルト24時間のキャンセル期限を過ぎている
        Booking::factory()->create([
            'staff_id' => $staff->id,
            'menu_id' => $menu->id,
            'booking_reference' => 'BKG-CANCEL04',
            'customer_email' => 'test@example.com',
            'start_time' => Carbon::now()->addHours(12),
            'end_time' => Carbon::now()->addHours(13),
            'status' => 'confirmed',
        ]);

        $response = $this->deleteJson('/api/bookings/BKG-CANCEL04', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(403);
    }
}
