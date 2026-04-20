<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SurveyQuestionController extends Controller
{
    // 一覧取得
    public function index(): JsonResponse
    {
        return response()->json(SurveyQuestion::orderBy('order')->get());
    }

    // 保存（新規作成・更新を一括で行う）
    public function store(Request $request): JsonResponse
    {
        $questions = $request->input('questions');

        // ▼追加：実際に保存/更新されたDBのIDを記録する配列
        $savedIds = [];

        foreach ($questions as $index => $q) {
            $survey = SurveyQuestion::updateOrCreate(
                ['id' => $q['id'] ?? null],
                [
                    'question_text' => $q['question_text'],
                    'type' => $q['type'],
                    'options' => $q['options'] ?? null,
                    'is_required' => $q['is_required'] ?? false,
                    'order' => $index,
                ]
            );
            // ▼追加：作成・更新された最新のIDをメモする
            $savedIds[] = $survey->id;
        }

        // ▼修正：メモした最新のID「以外」の古いデータを削除する
        SurveyQuestion::whereNotIn('id', $savedIds)->delete();

        return response()->json(['message' => 'アンケート設定を保存しました']);
    }
}
