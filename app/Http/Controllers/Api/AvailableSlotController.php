<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AvailableSlotController extends Controller
{
    public function index(Request $request, BookingService $bookingService): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'menu_id' => ['required', 'integer', 'exists:menus,id'],
        ]);

        $targetDate = Carbon::parse($validated['date']);
        $menu = Menu::findOrFail($validated['menu_id']);
        $dayOfWeek = $bookingService->extractDayOfWeek($targetDate);

        $settings = $bookingService->getOrCreateSettings();

        if ($bookingService->isRegularHoliday($dayOfWeek)) {
            return response()->json([]);
        }

        $staffIds = $bookingService->getAvailableStaffIds($dayOfWeek);
        $staffCount = count($staffIds);
        if ($staffCount === 0) {
            return response()->json([]);
        }

        if ($settings->booking_deadline_type !== 'time_based' && $bookingService->isBookingDeadlinePassed($targetDate, $settings)) {
            return response()->json([]);
        }

        $bookings = $bookingService->getBookingsOnDate($targetDate, $staffIds);

        $slots = $bookingService->calculateAvailableSlots(
            $targetDate,
            $menu->duration_minutes,
            $settings,
            $staffCount,
            $bookings
        );

        return response()->json($slots);
    }
}
