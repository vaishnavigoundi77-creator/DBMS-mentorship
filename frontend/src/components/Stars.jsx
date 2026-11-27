export default function Stars({ value }) {
  const n = Math.round(Number(value) || 0);
  return <span className="stars" aria-label={`${n} out of 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}
