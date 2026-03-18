<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_text', 'type', 'options', 'is_required', 'order',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array', // JSONを自動でPHPの配列に変換
            'is_required' => 'boolean',
        ];
    }
}
