import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { generateReference } from "../lib/reference";

const prisma = new PrismaClient();
const adminEmail = (
  process.env.ADMIN_EMAIL ?? "admin@feedback.app"
).toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!";

const samples: Array<
  Omit<Prisma.FeedbackCreateManyInput, "reference" | "createdAt">
> = [
  {
    type: "BUG",
    title: "Save button stays disabled after editing profile",
    message:
      "I changed my display name and the save button remained grey. Refreshing showed that the change had not been saved.",
    severity: "MEDIUM",
    status: "NEW",
    name: "Riley Chen",
    email: "riley@example.com",
    pageUrl: "/account/profile",
  },
  {
    type: "FEATURE",
    title: "Remember the last selected workspace",
    message:
      "I switch between the same two workspaces all day. Opening the last-used one by default would save a few clicks.",
    status: "IN_PROGRESS",
    name: "Morgan Patel",
    email: "morgan@example.com",
    pageUrl: "/workspaces",
  },
  {
    type: "GENERAL",
    title: "The new activity view is much easier to scan",
    message:
      "Just a quick thank-you to the team. The clearer timestamps and calmer layout make it much easier to catch up.",
    status: "RESOLVED",
    name: "Sam Rivera",
    email: null,
    pageUrl: "/activity",
  },
  {
    type: "BUG",
    title: "Invite link opens a blank page on mobile Safari",
    message:
      "When I tap the invite link from Mail on my iPhone, Safari opens a blank white page. Copying the link into Chrome works as expected.",
    severity: "HIGH",
    status: "IN_PROGRESS",
    name: "Avery Brooks",
    email: "avery@example.com",
    pageUrl: "/invite/accept",
  },
  {
    type: "FEATURE",
    title: "Add keyboard shortcuts for moving between notes",
    message:
      "It would be useful to move to the next or previous note from the detail view without returning to the full list.",
    status: "NEW",
    name: "Jamie Wilson",
    email: "jamie@example.com",
    pageUrl: "/notes",
  },
  {
    type: "GENERAL",
    title: "Small typo in the billing help text",
    message:
      "The sentence under the invoice history says 'recieve' instead of 'receive'. Everything else is clear.",
    status: "CLOSED",
    name: null,
    email: null,
    pageUrl: "/billing",
  },
  {
    type: "BUG",
    title: "Date filter uses the wrong day near midnight",
    message:
      "A report submitted around 11:30 PM local time appeared under tomorrow in the activity filter. I am in Pacific time.",
    severity: "LOW",
    status: "RESOLVED",
    name: "Taylor Kim",
    email: "taylor@example.com",
    pageUrl: "/reports",
  },
  {
    type: "FEATURE",
    title: "Let me export a filtered activity report",
    message:
      "I can filter to one project and date range, but I cannot download just those rows for our weekly review.",
    status: "IN_PROGRESS",
    name: "Jordan Lee",
    email: "jordan@example.com",
    pageUrl: "/reports/activity",
  },
  {
    type: "GENERAL",
    title: "Thanks for adding high contrast mode",
    message:
      "The new contrast setting has made the dashboard much more comfortable to use during long sessions.",
    status: "RESOLVED",
    name: "Casey Morgan",
    email: null,
    pageUrl: "/settings/accessibility",
  },
  {
    type: "BUG",
    title: "Search loses focus after the first result",
    message:
      "I type a search term, click a result, then use the back button. The search field is no longer focused and keyboard input goes nowhere.",
    severity: "MEDIUM",
    status: "NEW",
    name: "Drew Ellis",
    email: "drew@example.com",
    pageUrl: "/search",
  },
  {
    type: "FEATURE",
    title: "Show who last updated a shared item",
    message:
      "A small updated-by label would help our team understand who made the latest change to a shared checklist.",
    status: "CLOSED",
    name: "Alex Nguyen",
    email: "alex@example.com",
    pageUrl: "/checklists",
  },
  {
    type: "GENERAL",
    title: "Onboarding was quick and clear",
    message:
      "I got my team set up in a few minutes. The sample project was especially helpful for understanding the workflow.",
    status: "NEW",
    name: "Robin James",
    email: "robin@example.com",
    pageUrl: "/welcome",
  },
  {
    type: "BUG",
    title: "Uploaded image looks rotated in the preview",
    message:
      "Photos taken with my phone display correctly in the file picker but rotate sideways once the preview loads.",
    severity: "LOW",
    status: "IN_PROGRESS",
    name: "Emerson Fox",
    email: "emerson@example.com",
    pageUrl: "/files",
  },
  {
    type: "FEATURE",
    title: "Allow a custom color for project labels",
    message:
      "We use labels to separate customer-facing and internal work. A few more color choices would make that easier to recognize.",
    status: "RESOLVED",
    name: "Kendall Park",
    email: null,
    pageUrl: "/projects",
  },
  {
    type: "GENERAL",
    title: "Could not find where to update my email",
    message:
      "I eventually found it under account preferences, but expected it to be with the profile details. A link there might help.",
    status: "IN_PROGRESS",
    name: "Parker Reed",
    email: "parker@example.com",
    pageUrl: "/account",
  },
  {
    type: "BUG",
    title: "Notification count does not clear after reading",
    message:
      "I opened every item in the notification list, but the red count stayed at three until I refreshed the page.",
    severity: "MEDIUM",
    status: "CLOSED",
    name: "Quinn Bailey",
    email: "quinn@example.com",
    pageUrl: "/notifications",
  },
  {
    type: "FEATURE",
    title: "Pin a few frequently used projects",
    message:
      "A way to keep three or four projects at the top of the workspace list would help our larger teams.",
    status: "NEW",
    name: null,
    email: null,
    pageUrl: "/workspaces",
  },
  {
    type: "GENERAL",
    title: "The weekly digest arrived at a good time",
    message:
      "The Friday summary is concise and gives our team a useful prompt to close out the week.",
    status: "RESOLVED",
    name: "Skyler Diaz",
    email: "skyler@example.com",
    pageUrl: "/settings/notifications",
  },
  {
    type: "BUG",
    title: "Long project names overlap the menu button",
    message:
      "A project with a long title pushes the three-dot menu outside the visible area on a narrow laptop window.",
    severity: "LOW",
    status: "NEW",
    name: "Reese Carter",
    email: "reese@example.com",
    pageUrl: "/projects",
  },
  {
    type: "FEATURE",
    title: "Add a compact density option to the table",
    message:
      "Our team reviews hundreds of records. A denser table option would reduce scrolling during triage.",
    status: "IN_PROGRESS",
    name: "Finley Ross",
    email: "finley@example.com",
    pageUrl: "/records",
  },
  {
    type: "GENERAL",
    title: "A note about the keyboard focus ring",
    message:
      "The focus indicator is visible without being distracting. It has been a helpful addition for keyboard navigation.",
    status: "CLOSED",
    name: "Harper Lane",
    email: null,
    pageUrl: "/settings",
  },
  {
    type: "BUG",
    title: "Draft is lost when the session expires",
    message:
      "I spent several minutes writing a long update. After my session expired, signing in again left the editor blank.",
    severity: "HIGH",
    status: "NEW",
    name: "Dakota Price",
    email: "dakota@example.com",
    pageUrl: "/updates/new",
  },
  {
    type: "FEATURE",
    title: "Schedule a report to arrive on Monday",
    message:
      "Could the weekly report be delivered on a chosen weekday? Monday morning would fit our planning cadence better.",
    status: "RESOLVED",
    name: "Sage Turner",
    email: "sage@example.com",
    pageUrl: "/reports/schedule",
  },
  {
    type: "GENERAL",
    title: "The empty state helped me get started",
    message:
      "The first-time empty state pointed me in the right direction without taking over the screen. Nice detail.",
    status: "NEW",
    name: "Remy Ward",
    email: "remy@example.com",
    pageUrl: "/projects",
  },
  {
    type: "BUG",
    title: "CSV export drops accented characters",
    message:
      "Names with accented characters show as question marks when I open the exported report in spreadsheet software.",
    severity: "MEDIUM",
    status: "RESOLVED",
    name: "Noel Santos",
    email: "noel@example.com",
    pageUrl: "/reports/export",
  },
];

async function main() {
  const passwordHash = await hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  if ((await prisma.feedback.count()) === 0) {
    const now = Date.now();
    await prisma.feedback.createMany({
      data: samples.map((sample, index) => ({
        ...sample,
        reference: generateReference(),
        createdAt: new Date(
          now - (index * 3 + (index % 4)) * 24 * 60 * 60 * 1000,
        ),
      })),
    });
  }

  console.info(
    `Seeded admin ${adminEmail}; feedback rows: ${await prisma.feedback.count()}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
