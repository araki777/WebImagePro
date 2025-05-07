import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 環境変数の確認用ログ
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "exists" : "missing");
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  SERVICE_ROLE_KEY ? "exists" : "missing"
);

// サービスロール権限を持つSupabaseクライアントを作成（RLSをバイパス）
const adminSupabase = (() => {
  try {
    if (!SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
      return null;
    }
    if (!SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is missing");
      return null;
    }

    console.log("Creating admin Supabase client with URL:", SUPABASE_URL);

    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Failed to create admin Supabase client:", error);
    return null;
  }
})();

// RLSをバイパスする必要があるテーブルのリスト
const RLS_BYPASS_TABLES = ["user_settings", "user_profiles", "contacts"];

// データを保存するための汎用的なエンドポイント
export async function POST(request: Request) {
  try {
    // ミドルウェアからユーザーIDを取得
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが取得できません" },
        { status: 401 }
      );
    }

    const { table, data } = await request.json();

    // テーブル名が指定されていない場合はエラー
    if (!table) {
      return NextResponse.json(
        { error: "テーブル名が必要です" },
        { status: 400 }
      );
    }

    // データが指定されていない場合はエラー
    if (!data) {
      return NextResponse.json({ error: "データが必要です" }, { status: 400 });
    }

    // ユーザーIDを自動的に追加
    const dataWithUserId = {
      ...data,
      user_id: userId,
    };

    // Supabaseにデータを保存（RLSが問題になる場合はadminクライアントを使用）
    let result, error;

    if (adminSupabase && RLS_BYPASS_TABLES.includes(table)) {
      console.log("Using admin client for POST operation on table:", table);
      // 管理者権限でRLSをバイパス
      const response = await adminSupabase
        .from(table)
        .insert([dataWithUserId])
        .select();

      result = response.data;
      error = response.error;

      if (error) {
        console.error("Admin client error:", error);
      }
    } else {
      console.log("Using regular client for POST operation on table:", table);
      // 通常のクライアントを使用
      const response = await supabase
        .from(table)
        .insert([dataWithUserId])
        .select();

      result = response.data;
      error = response.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("データ保存エラー:", error);
    return NextResponse.json(
      { error: "データの保存に失敗しました" },
      { status: 500 }
    );
  }
}

// データを更新するためのエンドポイント
export async function PUT(request: Request) {
  try {
    // ミドルウェアからユーザーIDを取得
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが取得できません" },
        { status: 401 }
      );
    }

    const { table, id, data } = await request.json();

    // 必須パラメータのチェック
    if (!table || !id || !data) {
      return NextResponse.json(
        { error: "テーブル名、ID、データが必要です" },
        { status: 400 }
      );
    }

    // Supabaseでデータを更新（RLSが問題になる場合はadminクライアントを使用）
    let result, error;

    if (adminSupabase && RLS_BYPASS_TABLES.includes(table)) {
      // 管理者権限でRLSをバイパス
      const response = await adminSupabase
        .from(table)
        .update(data)
        .eq("user_id", id)
        .select();

      result = response.data;
      error = response.error;
    } else {
      // 通常のクライアントを使用
      const response = await supabase
        .from(table)
        .update(data)
        .eq("user_id", id)
        .select();

      result = response.data;
      error = response.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("データ更新エラー:", error);
    return NextResponse.json(
      { error: "データの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// データを取得するためのエンドポイント
export async function GET(request: Request) {
  try {
    // ミドルウェアからユーザーIDを取得
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが取得できません" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const table = url.searchParams.get("table");
    const id = url.searchParams.get("id");

    if (!table) {
      return NextResponse.json(
        { error: "テーブル名が必要です" },
        { status: 400 }
      );
    }

    // Supabaseでデータを取得（RLSが問題になる場合はadminクライアントを使用）
    let result, error;

    if (adminSupabase && RLS_BYPASS_TABLES.includes(table)) {
      // 管理者権限でRLSをバイパス
      let query = adminSupabase.from(table).select("*");

      // IDが指定されている場合は特定のレコードのみ取得
      if (id) {
        query = query.eq("id", id);
      } else {
        query = query.eq("user_id", userId);
      }

      const response = await query;
      result = response.data;
      error = response.error;
    } else {
      // 通常のクライアントを使用
      let query = supabase.from(table).select("*");

      // IDが指定されている場合は特定のレコードのみ取得
      if (id) {
        query = query.eq("id", id);
      } else {
        query = query.eq("user_id", userId);
      }

      const response = await query;
      result = response.data;
      error = response.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("データ取得エラー:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// データを削除するためのエンドポイント
export async function DELETE(request: Request) {
  try {
    // ミドルウェアからユーザーIDを取得
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが取得できません" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const table = url.searchParams.get("table");
    const id = url.searchParams.get("id");

    if (!table || !id) {
      return NextResponse.json(
        { error: "テーブル名とIDが必要です" },
        { status: 400 }
      );
    }

    // Supabaseでデータを削除（RLSが問題になる場合はadminクライアントを使用）
    let error;

    if (adminSupabase && RLS_BYPASS_TABLES.includes(table)) {
      // 管理者権限でRLSをバイパス
      const response = await adminSupabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      error = response.error;
    } else {
      // 通常のクライアントを使用
      const response = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      error = response.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("データ削除エラー:", error);
    return NextResponse.json(
      { error: "データの削除に失敗しました" },
      { status: 500 }
    );
  }
}
