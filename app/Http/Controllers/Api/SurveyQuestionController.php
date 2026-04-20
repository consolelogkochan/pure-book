<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;

class SurveyQuestionController extends Controller
{
    // お客様向けに「質問一覧」を並び順(order)通りに返す
    public function index()
    {
        return response()->json(SurveyQuestion::orderBy('order')->get());
    }
}
