import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

faker.seed(42);

// Real-world tickers pool
const TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'Stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'Stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'Stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'Stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'Stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'Stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'Stock' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', assetClass: 'Stock' },
  { symbol: 'V', name: 'Visa Inc.', assetClass: 'Stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', assetClass: 'Stock' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', assetClass: 'Stock' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', assetClass: 'Stock' },
  { symbol: 'HD', name: 'Home Depot Inc.', assetClass: 'Stock' },
  { symbol: 'MA', name: 'Mastercard Inc.', assetClass: 'Stock' },
  { symbol: 'BAC', name: 'Bank of America Corp.', assetClass: 'Stock' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', assetClass: 'Stock' },
  { symbol: 'KO', name: 'Coca-Cola Co.', assetClass: 'Stock' },
  { symbol: 'PFE', name: 'Pfizer Inc.', assetClass: 'Stock' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', assetClass: 'Stock' },
  { symbol: 'WMT', name: 'Walmart Inc.', assetClass: 'Stock' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', assetClass: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', assetClass: 'ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', assetClass: 'ETF' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', assetClass: 'ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', assetClass: 'ETF' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', assetClass: 'ETF' },
  { symbol: 'AGG', name: 'iShares Core US Aggregate Bond ETF', assetClass: 'ETF' },
  { symbol: 'HYG', name: 'iShares iBoxx High Yield Corp Bond ETF', assetClass: 'ETF' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', assetClass: 'ETF' },
  { symbol: 'UST', name: 'US Treasury 2-Year Note', assetClass: 'Bond' },
  { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', assetClass: 'Bond' },
  { symbol: 'LQD', name: 'iShares iBoxx Investment Grade Corp Bond ETF', assetClass: 'Bond' },
  { symbol: 'MUB', name: 'iShares National Muni Bond ETF', assetClass: 'Bond' },
  { symbol: 'VCIT', name: 'Vanguard Intermediate-Term Corporate Bond ETF', assetClass: 'Bond' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', assetClass: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', assetClass: 'Crypto' },
  { symbol: 'SOL-USD', name: 'Solana USD', assetClass: 'Crypto' },
];

// Generate additional synthetic tickers to fill out 200 positions per portfolio
function generateSyntheticTicker(index) {
  const assetClasses = ['Stock', 'ETF', 'Bond'];
  const ac = assetClasses[index % 3];
  const sym = faker.string.alpha({ length: { min: 3, max: 5 }, casing: 'upper' }) + index;
  return {
    symbol: sym,
    name: faker.company.name() + (ac === 'ETF' ? ' ETF' : ac === 'Bond' ? ' Bond' : ' Inc.'),
    assetClass: ac,
  };
}

function rnd(min, max, decimals = 2) {
  return parseFloat((faker.number.float({ min, max }) ).toFixed(decimals));
}

function sign() {
  return faker.datatype.boolean() ? 1 : -1;
}

// --- Portfolios ---
const portfolioNames = [
  'Growth Portfolio',
  'Income & Dividend',
  'Tech Concentrated',
  'Balanced Allocation',
  'Fixed Income Ladder',
];

const portfolios = portfolioNames.map((name, i) => {
  const totalValue = rnd(250000, 5000000);
  const dailyPnL = parseFloat((totalValue * rnd(0.001, 0.025) * sign()).toFixed(2));
  const dailyPnLPercent = parseFloat(((dailyPnL / totalValue) * 100).toFixed(4));
  const ytdReturn = parseFloat((totalValue * rnd(0.02, 0.35) * sign()).toFixed(2));
  const ytdReturnPercent = parseFloat(((ytdReturn / (totalValue - ytdReturn)) * 100).toFixed(4));

  return {
    id: `p${i + 1}`,
    name,
    description: faker.lorem.sentence(10),
    currency: 'USD',
    createdAt: faker.date.past({ years: 5 }).toISOString(),
    totalValue,
    dailyPnL,
    dailyPnLPercent,
    ytdReturn,
    ytdReturnPercent,
  };
});

// --- Positions ---
const positions = [];
let positionId = 1;

// Build extended ticker list (38 real + synthetic)
const extendedTickers = [...TICKERS];
while (extendedTickers.length < 200) {
  extendedTickers.push(generateSyntheticTicker(extendedTickers.length));
}

portfolios.forEach((portfolio) => {
  // Shuffle ticker order per portfolio so each portfolio has different mixes
  const shuffled = faker.helpers.shuffle([...extendedTickers]).slice(0, 200);
  let totalMarketValue = 0;

  const rawPositions = shuffled.map((ticker) => {
    const currentPrice = rnd(5, 2000);
    const quantity = rnd(10, 5000, 0);
    const marketValue = parseFloat((quantity * currentPrice).toFixed(2));
    totalMarketValue += marketValue;

    const avgCostDelta = rnd(0.9, 1.1);
    const avgCost = parseFloat((currentPrice * avgCostDelta).toFixed(4));
    const unrealizedPnL = parseFloat(((currentPrice - avgCost) * quantity).toFixed(2));
    const unrealizedPnLPercent = parseFloat((((currentPrice - avgCost) / avgCost) * 100).toFixed(4));
    const dayChange = parseFloat((currentPrice * rnd(0.005, 0.04) * sign()).toFixed(4));
    const dayChangePercent = parseFloat(((dayChange / currentPrice) * 100).toFixed(4));

    return {
      id: `pos${positionId++}`,
      portfolioId: portfolio.id,
      symbol: ticker.symbol,
      name: ticker.name,
      assetClass: ticker.assetClass,
      quantity: parseFloat(quantity),
      avgCost,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      weight: 0, // calculate after
      dayChange,
      dayChangePercent,
    };
  });

  // Normalize weights
  rawPositions.forEach((p) => {
    p.weight = parseFloat(((p.marketValue / totalMarketValue) * 100).toFixed(4));
    positions.push(p);
  });
});

// --- Transactions ---
const TRANSACTION_TYPES = ['Buy', 'Sell', 'Dividend', 'Transfer'];
const TRANSACTION_STATUSES = ['Settled', 'Pending', 'Cancelled'];

const transactions = [];
for (let i = 0; i < 10000; i++) {
  const portfolio = faker.helpers.arrayElement(portfolios);
  const position = faker.helpers.arrayElement(
    positions.filter((p) => p.portfolioId === portfolio.id)
  );
  const type = faker.helpers.arrayElement(TRANSACTION_TYPES);
  const quantity = rnd(1, 500, 2);
  const price = rnd(5, 2000);
  const total = parseFloat((quantity * price).toFixed(2));
  const fee = parseFloat((total * rnd(0.0005, 0.005)).toFixed(2));

  transactions.push({
    id: `tx${i + 1}`,
    portfolioId: portfolio.id,
    symbol: position.symbol,
    name: position.name,
    type,
    quantity,
    price,
    total,
    fee,
    date: faker.date.between({ from: '2020-01-01', to: '2025-12-31' }).toISOString(),
    status: faker.helpers.arrayElement(TRANSACTION_STATUSES),
  });
}

// Sort transactions by date descending
transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

const db = { portfolios, positions, transactions };

writeFileSync(join(__dirname, 'db.json'), JSON.stringify(db, null, 2));

console.log(`Portfolios: ${portfolios.length}`);
console.log(`Positions:  ${positions.length}`);
console.log(`Transactions: ${transactions.length}`);
console.log('db.json written successfully.');
