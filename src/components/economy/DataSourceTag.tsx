interface DataSourceTagProps {
  source: string
}

export default function DataSourceTag({ source }: DataSourceTagProps) {
  return (
    <span className="inline-block text-[10px] text-muted bg-border/50 px-2 py-0.5 rounded-full">
      Source: {source}
    </span>
  )
}
