# Sanity + Next.js Project Documentation

This repository contains two adjacent projects:

- `studio-hello-world`: Sanity Studio for authoring content
- `nextjs-hello-world`: Next.js App for rendering published content

---

## 1. Prerequisites

- Node.js installed
- Sanity CLI available (`npm install -g @sanity/cli` or use `npx`)
- A Sanity project ID and dataset

---

## 2. Sanity Studio Setup

### 2.1 Create the Studio

Run the following command from the repository root:

```bash
npm create sanity@latest -- --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world
```

### 2.2 Run the Studio locally

From `studio-hello-world`:

```bash
npm run dev
```

Open the Studio in your browser at:

```text
http://localhost:3333
```

### 2.3 Define the Post schema

Create the file:

```text
studio-hello-world/schemaTypes/postType.ts
```

Paste this content:

```ts
import { defineField, defineType } from 'sanity';

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
});
```

### 2.4 Register the schema

Open:

```text
studio-hello-world/schemaTypes/index.ts
```

Update it to import and export the new schema:

```ts
import { postType } from './postType';

export const schemaTypes = [postType];
```

### 2.5 Publish your first document

Once the schema is saved, the Studio should reload automatically. Click the `+` button to create and publish a new `Post` document.

---

## 3. Next.js App Setup

### 3.1 Create the Next.js app

From the repository root, run:

```bash
npx create-next-app@latest nextjs-hello-world --tailwind --ts --app --src-dir --eslint --import-alias "@/*" --turbopack
cd nextjs-hello-world
```

Your folder structure should look like:

```text
/nextjs-hello-world
/studio-hello-world
```

### 3.2 Install Sanity dependencies

From `nextjs-hello-world`:

```bash
npm install --legacy-peer-deps next-sanity @sanity/image-url @tailwindcss/typography
```

### 3.3 Run the Next.js app

From `nextjs-hello-world`:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

### 3.4 Configure the Sanity client

Create the folder and file:

```text
nextjs-hello-world/src/sanity/client.ts
```

Paste this code:

```ts
import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: 'YOUR-PROJECT-ID',
  dataset: 'production',
  apiVersion: '2026-05-15',
  useCdn: false,
});
```

Replace `YOUR-PROJECT-ID` with your actual Sanity project ID.

---

## 4. Render Sanity Content in Next.js

### 4.1 Display posts on the homepage

Update the home page:

```text
nextjs-hello-world/src/app/page.tsx
```

Use this content:

```tsx
import Link from 'next/link';
import { type SanityDocument } from 'next-sanity';
import { client } from '@/sanity/client';

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <ul className="flex flex-col gap-y-4">
        {posts.map((post) => (
          <li className="hover:underline" key={post._id}>
            <Link href={`/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p>{new Date(post.publishedAt).toLocaleDateString()}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### 4.2 Create the dynamic post page

Create the file:

```text
nextjs-hello-world/src/app/[slug]/page.tsx
```

Use this content:

```tsx
import { PortableText, type SanityDocument } from 'next-sanity';
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { client } from '@/sanity/client';
import Link from 'next/link';

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;
const { projectId, dataset } = client.config();

const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);
  const postImageUrl = post.image
    ? urlFor(post.image)?.width(550).height(310).url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>
      {postImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={postImageUrl}
          alt={post.title}
          className="aspect-video rounded-xl"
          width="550"
          height="310"
        />
      )}
      <h1 className="text-4xl font-bold mb-8">{post.title}</h1>
      <div className="prose">
        <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
    </main>
  );
}
```

---

## 5. Common Issue: 404 on Post Pages

If a published post appears on the homepage but its detail page returns `404`, verify:

1. `src/app/[slug]/page.tsx` exists inside the Next.js App Router folder.
2. `Link href={`/${post.slug.current}`}` uses the correct slug.
3. The slug field is set and published in Sanity.

---

## 6. Useful Commands

```bash
# Run Sanity Studio
cd studio-hello-world
npm run dev

# Run Next.js app
cd nextjs-hello-world
npm run dev
```

---

## 7. File reference summary

- `studio-hello-world/schemaTypes/postType.ts`
- `studio-hello-world/schemaTypes/index.ts`
- `nextjs-hello-world/src/sanity/client.ts`
- `nextjs-hello-world/src/app/page.tsx`
- `nextjs-hello-world/src/app/[slug]/page.tsx`


Notice that we’re using Tailwind CSS Typography’s prose class to style the post’s body content. We installed @tailwindcss/typography in the dependencies step. Enable it by adding @plugin "@tailwindcss/typography"; to src/app/globals.css below the existing @import "tailwindcss"; line.

/nextjs-hello-world/src/app/[slug]/page.tsx
import { PortableText, type SanityDocument } from "next-sanity";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;
const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;
const options = { next: { revalidate: 30 } };
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  const postImageUrl = post.image
    ? urlFor(post.image)?.width(550).height(310).url()
    : null;
  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>
      {postImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={postImageUrl}
          alt={post.title}
          className="aspect-video rounded-xl"
          width="550"
          height="310"
        />
      )}
      <h1 className="text-4xl font-bold mb-8">{post.title}</h1>
      <div className="prose">
        <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
    </main>
  );
}

Deploying Studio and inviting editors

1
Deploy your Studio with Sanity
In your Studio directory (studio-hello-world) run the following command to deploy your Sanity Studio.

The first time you run this command, the CLI will prompt you to enter a hostname. This is the unique name for your Studio's URL (entering my-app will make your Studio available at my-app.sanity.studio).

npm
pnpm
yarn
bun
npm run deploy

2
Invite a collaborator
Now that you’ve deployed your Studio, you can optionally invite a collaborator to your project. Navigate to your project in Sanity Manage, then select "Members".

They will be able to access the deployed Studio, where you can collaborate together on creating content.
