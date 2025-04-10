'use client';

import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/ui/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Container>
        <div className="space-y-6 py-10 max-w-3xl mx-auto flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">プライバシーポリシー</h1>
          <Separator />
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. はじめに</h2>
            <p>
              WebImagePro（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
              このプライバシーポリシーでは、当サービスが収集する情報とその使用方法について説明します。
              当サービスを利用することにより、このプライバシーポリシーに同意したものとみなされます。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. 収集する情報</h2>
            <p>当サービスでは、以下の情報を収集することがあります：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>アカウント情報（ユーザー名、メールアドレス等）</li>
              <li>アップロードされた画像データ</li>
              <li>利用状況や閲覧履歴</li>
              <li>デバイス情報（IPアドレス、ブラウザタイプ等）</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的で利用されます：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>サービスの提供と運営</li>
              <li>ユーザーサポート</li>
              <li>サービスの改善と新機能の開発</li>
              <li>不正利用の防止</li>
              <li>利用統計の分析</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. 情報の共有</h2>
            <p>
              当サービスは、法律で定められた場合や、ユーザーの同意がある場合を除き、
              収集した個人情報を第三者と共有することはありません。
              ただし、以下の場合には情報を共有することがあります：
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>サービス提供に必要なパートナー企業（データ保存、分析ツール等）</li>
              <li>法的要請に応じる場合</li>
              <li>当サービスの権利や財産を保護する必要がある場合</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. データの保護</h2>
            <p>
              当サービスは、収集した情報を保護するために適切なセキュリティ対策を実施しています。
              ただし、インターネット上のデータ送信や電子ストレージは100%安全ではないことをご了承ください。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Cookieの使用</h2>
            <p>
              当サービスでは、ユーザー体験の向上や利用状況の分析のためにCookieを使用しています。
              ブラウザの設定でCookieを無効にすることも可能ですが、一部の機能が正常に動作しなくなる可能性があります。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. ユーザーの権利</h2>
            <p>ユーザーには以下の権利があります：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>個人情報へのアクセス</li>
              <li>個人情報の訂正または削除</li>
              <li>データ処理の制限</li>
              <li>データポータビリティ</li>
            </ul>
            <p>
              これらの権利行使については、お問い合わせフォームよりご連絡ください。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. 子どもについて</h2>
            <p>
              当サービスは16歳未満の子どもを対象としていません。
              16歳未満の方は、保護者の同意なく個人情報を提供しないでください。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. プライバシーポリシーの変更</h2>
            <p>
              当サービスは、必要に応じてプライバシーポリシーを変更することがあります。
              変更があった場合は、当ページで通知します。
              定期的に確認することをお勧めします。
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. お問い合わせ</h2>
            <p>
              プライバシーポリシーに関するご質問やご意見については、
              お問い合わせフォームよりご連絡ください。
            </p>
          </section>
          
          <div className="text-sm text-muted-foreground pt-4">
            最終更新日: 2023年12月1日
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
} 