'use client';

const CITIES = [
  { name: 'São Paulo', state: 'SP', x: 52, y: 68 },
  { name: 'Rio de Janeiro', state: 'RJ', x: 58, y: 63 },
  { name: 'Belo Horizonte', state: 'MG', x: 54, y: 60 },
  { name: 'Brasília', state: 'DF', x: 52, y: 48 },
  { name: 'Salvador', state: 'BA', x: 62, y: 50 },
  { name: 'Fortaleza', state: 'CE', x: 65, y: 30 },
  { name: 'Manaus', state: 'AM', x: 28, y: 28 },
  { name: 'Porto Alegre', state: 'RS', x: 46, y: 80 },
  { name: 'Recife', state: 'PE', x: 72, y: 38 },
  { name: 'Curitiba', state: 'PR', x: 48, y: 74 },
];

export default function CityMap({ poll, color }: { poll: any; color: string }) {
  const cities = poll.cities || {};
  const topCities = Object.entries(cities)
    .map(([name, data]: any) => ({
      name,
      total: (data.votesA || 0) + (data.votesB || 0),
      pctA: data.votesA ? Math.round((data.votesA / ((data.votesA || 0) + (data.votesB || 0))) * 100) : 50,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (topCities.length === 0) return (
    <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
      Nenhum voto geolocalizado ainda
    </div>
  );

  return (
    <div className="space-y-3">
      {topCities.map((city) => (
        <div key={city.name}>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>{city.name}</span>
            <span>{city.total} votos</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${city.pctA}%`, background: color }} />
          </div>
          <div className="flex justify-between text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>{poll.optionA?.emoji} {city.pctA}%</span>
            <span>{100 - city.pctA}% {poll.optionB?.emoji}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
