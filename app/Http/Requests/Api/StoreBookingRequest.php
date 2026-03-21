<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 今回はゲスト（未ログインの一般ユーザー）でも予約できる仕様のため、常に true を返します
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // メニューは必須で、menusテーブルに存在すること
            'menu_id' => ['required', 'integer', 'exists:menus,id'],

            // スタッフは任意だが、入力された場合はstaffsテーブルに存在すること
            'staff_id' => ['nullable', 'integer', 'exists:staffs,id'],

            // 開始時間は必須で、正しい日時フォーマットかつ「現在時刻より未来」であること
            'start_time' => ['required', 'date', 'after:now'],

            // お客様情報は必須
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'], // 電話番号はハイフン等も考慮してstring

            // メモとアンケートは任意
            'customer_memo' => ['nullable', 'string', 'max:1000'],
            'survey_responses' => ['nullable', 'array'],
        ];
    }
}
