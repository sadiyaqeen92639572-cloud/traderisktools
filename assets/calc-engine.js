/*
 * Shared math: futures tick/point value, multi-asset position sizing, stop-loss price.
 * Futures math takes tickSizePoints + tickValueUsd directly from data/futures-contracts.json
 * per symbol — never hardcode a contract constant here, the JSON is the single source.
 */

// priceMove in index points, contract spec gives $ per tick and points per tick.
function tickValue({ priceMovePoints, tickSizePoints, tickValueUsd, contracts }) {
  priceMovePoints = Number(priceMovePoints) || 0;
  tickSizePoints = Number(tickSizePoints) || 0;
  tickValueUsd = Number(tickValueUsd) || 0;
  contracts = Number(contracts) || 1;

  const ticks = tickSizePoints > 0 ? priceMovePoints / tickSizePoints : 0;
  const dollarsPerContract = ticks * tickValueUsd;
  const pointValueUsd = tickSizePoints > 0 ? tickValueUsd / tickSizePoints : 0;

  return {
    ticks,
    dollarsPerContract,
    totalDollars: dollarsPerContract * contracts,
    pointValueUsd // $ per full point, per contract — the other common query direction
  };
}

// assetType: 'stock' | 'forex' | 'futures'
function positionSize({ assetType, accountSize, riskPct, entryPrice, stopPrice, pointValueUsd, pipValueUsd, pipSize }) {
  accountSize = Number(accountSize) || 0;
  riskPct = Number(riskPct) || 0;
  entryPrice = Number(entryPrice) || 0;
  stopPrice = Number(stopPrice) || 0;

  const riskAmount = accountSize * (riskPct / 100);
  const priceRisk = Math.abs(entryPrice - stopPrice);

  let units = 0;
  let unitLabel = 'shares';

  if (assetType === 'stock') {
    unitLabel = 'shares';
    units = priceRisk > 0 ? riskAmount / priceRisk : 0;
  } else if (assetType === 'forex') {
    unitLabel = 'lots (standard)';
    pipValueUsd = Number(pipValueUsd) || 10; // $10/pip is standard-lot USD-quote default
    pipSize = Number(pipSize) || 0.0001;
    const pips = priceRisk / pipSize;
    const riskPerLot = pips * pipValueUsd;
    units = riskPerLot > 0 ? riskAmount / riskPerLot : 0;
  } else if (assetType === 'futures') {
    unitLabel = 'contracts';
    pointValueUsd = Number(pointValueUsd) || 0;
    const riskPerContract = priceRisk * pointValueUsd;
    units = riskPerContract > 0 ? riskAmount / riskPerContract : 0;
  }

  return { riskAmount, priceRisk, units, unitLabel };
}

function stopLossPrice({ entryPrice, accountSize, riskPct, positionUnits, direction }) {
  entryPrice = Number(entryPrice) || 0;
  accountSize = Number(accountSize) || 0;
  riskPct = Number(riskPct) || 0;
  positionUnits = Number(positionUnits) || 0;
  const riskAmount = accountSize * (riskPct / 100);
  const priceMove = positionUnits > 0 ? riskAmount / positionUnits : 0;
  const stopPrice = direction === 'short' ? entryPrice + priceMove : entryPrice - priceMove;
  return { riskAmount, priceMove, stopPrice };
}

function fmtUSD(n) {
  n = Number(n);
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function fmtNum(n, digits) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits === undefined ? 2 : digits });
}

if (typeof module !== 'undefined') {
  module.exports = { tickValue, positionSize, stopLossPrice, fmtUSD, fmtNum };
}
