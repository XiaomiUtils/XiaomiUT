import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { GetStaticProps } from 'next';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface LegalProps {
  content: string;
}

export default function Legal({ content }: LegalProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Legal Information — XiaomiUT</title>
        <meta name="description" content="Legal notice, privacy policy, and EU/DE information for XiaomiUT." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>

      {/* Reusing the same #center layout as index.tsx for visual consistency */}
      <section id="center">
        <div className="hero">
          <h1>XiaomiUT</h1>
        </div>

        <div className="legal-card">
          {/* Top navigation bar with a back link */}
          <nav className="legal-nav">
            <Link href="/" className="back-link">
              <ArrowLeftOutlined />
              Back to Search
            </Link>
          </nav>

          {/* ReactMarkdown renders the .md file content.
              All elements are styled via .legal-content in globals.css */}
          <article className="legal-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </div>
      </section>

      {/* Reusing the existing ticks + spacer footer pattern */}
      <div className="ticks" />
      <section id="spacer" />
    </>
  );
}

/**
 * getStaticProps runs at BUILD TIME on the server only.
 * The markdown file is read from disk once — zero runtime I/O,
 * zero API calls, the content is baked into the HTML.
 */
export const getStaticProps: GetStaticProps<LegalProps> = async () => {
  const filePath = path.join(process.cwd(), 'src', 'content', 'legal.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  return {
    props: { content },
  };
};
