'use client';

import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <Container>
      <div className="space-y-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">利用規約</h1>
        <Separator />
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. はじめに</h2>
          <p>
            この利用規約（以下「本規約」）は、WebImagePro（以下「当サービス」）の利用条件を定めるものです。
            ユーザーは、本規約に同意の上、当サービスを利用するものとします。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. サービス内容</h2>
          <p>
            当サービスは、画像編集・加工機能を提供するウェブアプリケーションです。
            当サービスの機能は予告なく変更、追加、削除される場合があります。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. アカウント</h2>
          <p>
            当サービスの一部機能を利用するには、アカウント登録が必要です。
            ユーザーは、以下の事項に同意するものとします：
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>正確かつ最新の情報を提供すること</li>
            <li>アカウント情報の機密性を保持すること</li>
            <li>アカウントの不正使用に関する責任を負うこと</li>
            <li>不正行為が発覚した場合、直ちに当社に通知すること</li>
          </ul>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. 利用制限</h2>
          <p>ユーザーは、以下の行為を行わないことに同意するものとします：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>法律に違反する行為</li>
            <li>他者の権利を侵害する行為</li>
            <li>有害なコンテンツのアップロードや配布</li>
            <li>当サービスの運営を妨害する行為</li>
            <li>不正アクセスやセキュリティ回避を試みる行為</li>
            <li>当サービスのリバースエンジニアリングを行う行為</li>
          </ul>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. 知的財産権</h2>
          <p>
            当サービスに関連するコンテンツ、ロゴ、デザイン、ソフトウェアなどの知的財産権は、
            当社または正当な権利者に帰属します。ユーザーは、当サービスを通じて作成した
            コンテンツの知的財産権を保持しますが、当社はサービス提供のために必要な範囲で
            これらのコンテンツを使用する権利を有します。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. 免責事項</h2>
          <p>
            当サービスは「現状有姿」で提供され、特定の目的への適合性や商品性を含む
            明示的または黙示的な保証はありません。当社は、サービスの中断、遅延、
            セキュリティ侵害、データ損失、または第三者のコンテンツに起因する損害について
            責任を負いません。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. 責任制限</h2>
          <p>
            法律で許容される最大限の範囲において、当社は、直接的、間接的、偶発的、
            特別、結果的、または懲罰的損害を含むいかなる損害についても責任を負いません。
            当社の責任が認められる場合でも、その責任はユーザーが当サービスに支払った
            金額を上限とします。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. 変更と終了</h2>
          <p>
            当社は、本規約を随時変更する権利を有します。重要な変更がある場合は、
            適切な方法で通知します。また、当社は、予告なく当サービスの全部または
            一部を終了または変更する権利を有します。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. 準拠法と管轄裁判所</h2>
          <p>
            本規約は日本法に準拠し、解釈されます。本規約に関連する紛争は、
            東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. お問い合わせ</h2>
          <p>
            本規約に関するご質問やご意見については、お問い合わせフォームよりご連絡ください。
          </p>
        </section>
        
        <div className="text-sm text-muted-foreground pt-4">
          最終更新日: 2023年12月1日
        </div>
      </div>
    </Container>
  );
} 