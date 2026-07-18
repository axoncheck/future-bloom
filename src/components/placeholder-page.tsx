type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
    </div>
  );
}