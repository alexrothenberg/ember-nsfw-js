import { helper } from '@ember/component/helper';

export default helper(function percentage([pct], opts={}) {
  const value = (pct || 0)*100;
  const numDecimals = opts.decimals || 0;

  return `${value.toFixed(value % 1 === 0 ? 0 : numDecimals)}%`;
});
