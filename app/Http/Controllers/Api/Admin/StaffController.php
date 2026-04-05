<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staffs = Staff::orderBy('id', 'desc')->get();
        return response()->json($staffs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255', // roleは空っぽ(null)でもOK
        ]);

        $staff = Staff::create($validated);
        return response()->json($staff, 201);
    }

    public function update(Request $request, Staff $staff): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
        ]);

        $staff->update($validated);
        return response()->json($staff);
    }

    public function toggleStatus(Staff $staff): JsonResponse
    {
        $staff->update(['is_active' => !$staff->is_active]);
        return response()->json($staff);
    }
}