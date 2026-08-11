Next.js quick start

Setting up your studio

1
Create a new Studio with Sanity CLI
Run the command in your Terminal to initialize your project on your local computer.

See the documentation if you are having issues with the CLI.

npm create sanity@latest -- --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world


2
Run Sanity Studio locally
Inside the directory of the Studio, start the development server by running the following command.

npm
pnpm
yarn
bun
# in studio-hello-world 
npm run dev

3
Log in to the Studio
Open the Studio running locally in your browser from http://localhost:3333.

You should now see a screen prompting you to log in to the Studio. Use the same service (Google, GitHub, or email) that you used when you logged in to the CLI.

Defining a schema

The Sanity Studio can only interact with documents in a dataset for which it has schema types registered in its configuration. It currently has none.


Next.js quick start
Last updated April 16, 2026
Defining a schema

Copy article

The Sanity Studio can only interact with documents in a dataset for which it has schema types registered in its configuration. It currently has none.


10
10

1
Create a new document type
Create a new file in your Studio’s schemaTypes folder called postType.ts with the code below which contains a set of fields for a new post document type.

/studio-hello-world/schemaTypes/postType.ts
import {defineField, defineType} from 'sanity'
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
      options: {source: 'title'},
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
      of: [{type: 'block'}],
    }),
  ],
})


2
Register the post schema type to the Studio schema
Now you can import this document type into the schemaTypes array in the index.ts file in the same folder.

/studio-hello-world/schemaTypes/index.ts
import {postType} from './postType'
export const schemaTypes = [postType]

3
Publish your first document
When you save these two files, your Studio should automatically reload and show your first document type. Click the + symbol at the top left to create and publish a new post document.


Displaying content in Next.js

1
Install a new Next.js application
If you have an existing application, skip this first step and adapt the rest of the lesson to install Sanity dependencies to fetch and render content.

Run the following in a new tab or window in your Terminal (keep the Studio running) to create a new Next.js application with Tailwind CSS and TypeScript.

You should now have your Studio and Next.js application in two separate, adjacent folders:

npm
pnpm
yarn
bun
# outside your studio directory
npx create-next-app@latest nextjs-hello-world --tailwind --ts --app --src-dir --eslint --import-alias "@/*" --turbopack
cd nextjs-hello-world

├─ /nextjs-hello-world
└─ /studio-hello-world

Install Sanity dependencies
Run the following inside the nextjs-hello-world directory to install:

next-sanity a collection of utilities for integrating Next.js with Sanity
@sanity/image-url helper functions to take image data from Sanity and create a URL
npm
pnpm
yarn
bun
# in nextjs-hello-world
npm install --legacy-peer-deps next-sanity @sanity/image-url @tailwindcss/typography

3
Start the development server
Run the following command and open http://localhost:3000 in your browser.

npm
pnpm
yarn
bun
# in nextjs-hello-world
npm run dev

4
Configure the Sanity client
To fetch content from Sanity, you’ll first need to configure a Sanity Client.

Create a directory nextjs-hello-world/src/sanity and within it create a client.ts file, with the following code:

/nextjs-hello-world/src/sanity/client.ts
import { createClient } from "next-sanity";
export const client = createClient({
  projectId: "YOUR-PROJECT-ID",
  dataset: "production",
  apiVersion: "2026-05-15",
  useCdn: false,
});

5
Display content on the homepage
Next.js uses server components for loading data at specific routes. The current home page can be found at src/app/page.tsx.

Update it to render a list of posts fetched from your Sanity dataset using the code below.

/nextjs-hello-world/src/app/page.tsx
import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
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

6
Display individual posts
Create a new route for individual post pages.

The dynamic value of a slug when visiting /[slug] in the URL is used as a parameter in the GROQ query used by Sanity Client.

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
