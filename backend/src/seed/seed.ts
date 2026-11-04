import 'reflect-metadata';
import mongoose, { Types } from 'mongoose';
import { Site, SiteSchema } from '../sites/site.schema.js';
import { User, UserSchema } from '../users/user.schema.js';
import { Visit, VisitSchema } from '../visits/visit.schema.js';
import { buildPlan } from './plan.js';


/**
 * Seeds the small web. Safe to run any number of times:
 *   users   upserted by handle
 *   sites   matched by address; created, updated if the content changed, else left alone
 *   visits  upserted by seedKey; seed visits that are no longer in the plan are removed
 * Real data is never touched: published-by-hand sites keep their addresses, and
 * visits recorded by the app have no seedKey, so they are left alone.
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (run this through `npm run seed` so .env is loaded)');

  const plan = buildPlan();

  await mongoose.connect(uri);
  const UserModel = mongoose.model<User>(User.name, UserSchema);
  const SiteModel = mongoose.model<Site>(Site.name, SiteSchema);
  const VisitModel = mongoose.model<Visit>(Visit.name, VisitSchema);
  await Promise.all([UserModel.init(), SiteModel.init(), VisitModel.init()]); // make sure unique + text indexes exist

  // Users
  const userIds = new Map<string, Types.ObjectId>();
  for (const u of plan.users) {
    const doc = await UserModel.findOneAndUpdate(
      { handle: u.handle },
      { $set: { displayName: u.displayName } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    userIds.set(u.handle, doc!._id as Types.ObjectId);
  }

  // Sites
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const s of plan.sites) {
    const author = userIds.get(s.authorHandle)!;
    const existing = await SiteModel.findOne({ address: s.address }).lean();
    if (!existing) {
      await SiteModel.create({ address: s.address, title: s.title, html: s.html, text: s.text, author });
      created++;
    } else if (
      existing.title !== s.title ||
      existing.html !== s.html ||
      String(existing.author) !== String(author)
    ) {
      await SiteModel.updateOne(
        { address: s.address },
        { $set: { title: s.title, html: s.html, text: s.text, author } },
      );
      updated++;
    } else {
      unchanged++;
    }
  }

  // Visits
  const ops = plan.visits.map((v) => ({
    updateOne: {
      filter: { seedKey: v.seedKey },
      update: {
        $set: {
          user: userIds.get(v.userHandle)!,
          address: v.address,
          via: v.via,
          outcome: v.outcome,
          visitedAt: v.visitedAt,
          seedKey: v.seedKey,
        },
      },
      upsert: true,
    },
  }));
  const result = await VisitModel.bulkWrite(ops);
  const stale = await VisitModel.deleteMany({
    seedKey: { $exists: true, $nin: plan.visits.map((v) => v.seedKey) },
  });

  console.log('Seed complete');
  console.log(`  users   ${plan.users.length}`);
  console.log(`  sites   ${plan.sites.length} (created ${created}, updated ${updated}, unchanged ${unchanged})`);
  console.log(
    `  visits  ${plan.visits.length} (new ${result.upsertedCount}, existing ${result.matchedCount}, removed ${stale.deletedCount})`,
  );
  console.log(`  dead links: ${plan.deadAddresses.join(', ')}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
