/**
 * Created by rj on 07/03/17.
 */

const zscore = {
  80: 1.28,
  95: 1.96
};

export const degreesOfFreedom = n => n - 1;

export const standardDeviation = r => r * (1 - r);

export const standardError = (r, n) => Math.sqrt(standardDeviation(r) / n);

export const marginOfError = (r, n, p) => standardError(r, n) * zscore[p * 100];//jStat.studentt(p, degreesOfFreedom(n));