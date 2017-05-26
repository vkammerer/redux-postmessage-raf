export const logWithPerf = (label, obj) =>
  console.log(label, performance.now().toFixed(2), obj);
