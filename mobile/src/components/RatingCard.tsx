interface Props {
  title: string
  rating: number
  onRate: (s: number) => void
  onSubmit: () => void
}

export default function RatingCard({ title, rating, onRate, onSubmit }: Props) {
  return (
    <div className="mx-4 mb-4 m-card p-4">
      <p className="font-bold text-sm mb-3">{title}</p>
      <div className="flex gap-3 mb-3">
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => onRate(s)} className="text-3xl active:scale-110 transition-transform">
            {s <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      {rating > 0 && (
        <button onClick={onSubmit} className="m-btn m-btn-dark text-sm py-2.5 px-5">
          Submit
        </button>
      )}
    </div>
  )
}
