import dataSource from '../data-source';
import { User } from '../../identity/entities/user.entity';
import { Watch } from '../../watches/entities/watch.entity';
import { WatchCondition } from '../../watches/enums/watch-condition.enum';
import { WatchStatus } from '../../watches/enums/watch-status.enum';

const LUXURY_CATALOG = [
  { brand: 'Rolex', models: ['Submariner Date', 'Daytona', 'GMT-Master II', 'Datejust 41', 'Explorer II'] },
  { brand: 'Patek Philippe', models: ['Nautilus 5711', 'Aquanaut 5167', 'Calatrava 5227', 'Complications 5205'] },
  { brand: 'Audemars Piguet', models: ['Royal Oak 15500', 'Royal Oak Offshore', 'Code 11.59'] },
  { brand: 'Omega', models: ['Speedmaster Professional', 'Seamaster 300M', 'De Ville Prestige'] },
  { brand: 'Cartier', models: ['Santos de Cartier', 'Tank Must', 'Ballon Bleu 42'] },
  { brand: 'IWC', models: ['Portugieser Chronograph', 'Pilot Mark XX', 'Big Pilot'] },
  { brand: 'Jaeger-LeCoultre', models: ['Reverso Classic', 'Master Ultra Thin', 'Polaris Date'] },
  { brand: 'Panerai', models: ['Luminor Marina', 'Submersible', 'Radiomir'] },
  { brand: 'Tudor', models: ['Black Bay 58', 'Pelagos', 'Royal'] },
  { brand: 'Vacheron Constantin', models: ['Overseas', 'Fiftysix', 'Patrimony'] },
];

const CONDITIONS = [
  WatchCondition.NEW,
  WatchCondition.EXCELLENT,
  WatchCondition.VERY_GOOD,
  WatchCondition.GOOD,
];

function buildWatch(index: number, sellerId: string): Partial<Watch> {
  const entry = LUXURY_CATALOG[index % LUXURY_CATALOG.length];
  const model = entry.models[index % entry.models.length];
  const suffix = String(index + 1).padStart(3, '0');

  return {
    referenceNumber: `LUX-SEED-${suffix}`,
    serialNumber: `SN-SEED-${suffix}`,
    brand: entry.brand,
    model,
    askingPrice: (5000 + index * 1250 + (index % 7) * 500).toFixed(2),
    condition: CONDITIONS[index % CONDITIONS.length],
    photos: [
      `https://images.example.com/watches/seed-${suffix}-1.jpg`,
      `https://images.example.com/watches/seed-${suffix}-2.jpg`,
    ],
    status: WatchStatus.LISTED,
    sellerId,
  };
}

async function seedWatches() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const watchRepository = dataSource.getRepository(Watch);

  const seller = await userRepository.findOne({
    where: { email: 'seller@demo.com' },
  });

  if (!seller) {
    throw new Error('seller@demo.com not found. Run migrations first.');
  }

  const alreadySeeded = await watchRepository
    .createQueryBuilder('watch')
    .where('watch.reference_number LIKE :prefix', { prefix: 'LUX-SEED-%' })
    .getCount();

  if (alreadySeeded >= 100) {
    console.log(`Skipping: ${alreadySeeded} seeded watches already exist.`);
    await dataSource.destroy();
    return;
  }

  const watches = Array.from({ length: 100 }, (_, index) =>
    watchRepository.create(buildWatch(index, seller.id)),
  );

  await watchRepository.save(watches);
  console.log('Seeded 100 luxury watches for seller@demo.com');

  await dataSource.destroy();
}

seedWatches().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
