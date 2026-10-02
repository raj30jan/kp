'use client'

import { useEffect, useState } from 'react'
import { CloudSun, CloudRain, Sun, Cloud, CloudFog, CloudDrizzle, CloudSnow, CloudLightning, Droplets, Wind, Thermometer, MapPin, Calendar, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

// normalized condition code → icon + bilingual label
const CONDITIONS = {
  'sunny': { icon: Sun, en: 'Sunny', hi: 'धूप' },
  'clear': { icon: Sun, en: 'Clear', hi: 'साफ़' },
  'partly-cloudy': { icon: CloudSun, en: 'Partly Cloudy', hi: 'आंशिक बादल' },
  'cloudy': { icon: Cloud, en: 'Cloudy', hi: 'बादल' },
  'fog': { icon: CloudFog, en: 'Fog', hi: 'कोहरा' },
  'drizzle': { icon: CloudDrizzle, en: 'Drizzle', hi: 'बूँदाबाँदी' },
  'rain': { icon: CloudRain, en: 'Rain', hi: 'बारिश' },
  'snow': { icon: CloudSnow, en: 'Snow', hi: 'बर्फ़बारी' },
  'thunderstorm': { icon: CloudLightning, en: 'Thunderstorm', hi: 'आँधी-तूफ़ान' },
}
const cond = (code) => CONDITIONS[code] || CONDITIONS.clear

const DAY_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ADVISORY_STYLE = {
  thermometer: { icon: Thermometer, bg: 'bg-amber-50', color: 'text-amber-600' },
  rain: { icon: CloudRain, bg: 'bg-blue-50', color: 'text-blue-600' },
  wind: { icon: Wind, bg: 'bg-emerald-50', color: 'text-emerald-600' },
}

function dayLabel(dateStr, i, isHindi) {
  if (i === 0) return isHindi ? 'आज' : 'Today'
  const d = new Date(dateStr)
  const dow = Number.isNaN(d.getTime()) ? null : d.getDay()
  if (dow == null) return `Day ${i + 1}`
  return isHindi ? DAY_HI[dow] : DAY_EN[dow]
}

export default function WeatherPage() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [cities, setCities] = useState(['Ludhiana', 'Amritsar', 'Chandigarh', 'Delhi', 'Jaipur', 'Lucknow', 'Bhopal', 'Patna'])
  const [selectedCity, setSelectedCity] = useState('Ludhiana')
  const [wx, setWx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWeatherCities().then((r) => {
      if (Array.isArray(r?.cities) && r.cities.length) setCities(r.cities)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let on = true
    setLoading(true)
    api.getWeather(selectedCity)
      .then((r) => on && setWx(r))
      .catch(() => on && setWx(null))
      .finally(() => on && setLoading(false))
    return () => { on = false }
  }, [selectedCity])

  const today = wx?.current
  const todayCond = cond(today?.code)

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <CloudSun className='mx-auto mb-4 h-12 w-12 text-cyan-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'मौसम पूर्वानुमान' : 'Weather Forecast'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-cyan-100'>
            {isHindi ? '7-दिवसीय मौसम, वर्षा अलर्ट और कृषि सलाह' : '7-day weather, rainfall alerts and farming advice'}
          </p>
          {wx?.source && (
            <p className='mt-3 text-xs text-cyan-300'>
              {wx.source === 'imd'
                ? isHindi ? 'स्रोत: भारतीय मौसम विज्ञान विभाग (IMD)' : 'Source: India Meteorological Department (IMD)'
                : isHindi ? 'स्रोत: लाइव मौसम डेटा (Open-Meteo)' : 'Source: live weather data (Open-Meteo)'}
            </p>
          )}
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-12 md:px-6'>
        {/* City selector */}
        <div className='mb-8 flex flex-wrap items-center gap-2'>
          <MapPin className='h-5 w-5 text-emerald-600' />
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${selectedCity === city ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'}`}
            >
              {city}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='flex items-center justify-center gap-2 rounded-3xl bg-white p-16 text-gray-500 shadow-sm ring-1 ring-gray-100'>
            <Loader2 className='h-5 w-5 animate-spin' />
            {isHindi ? 'मौसम डेटा लोड हो रहा है…' : 'Loading weather data…'}
          </div>
        ) : !wx || !wx.forecast?.length ? (
          <div className='rounded-3xl bg-white p-16 text-center text-gray-500 shadow-sm ring-1 ring-gray-100'>
            {isHindi ? 'इस शहर के लिए मौसम डेटा उपलब्ध नहीं है।' : 'Weather data unavailable for this city.'}
          </div>
        ) : (
          <>
            {/* Today's weather card */}
            <div className='mb-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white shadow-lg'>
              <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
                <div>
                  <div className='flex items-center gap-2 text-cyan-100'>
                    <Calendar className='h-4 w-4' />
                    <span className='text-sm'>{isHindi ? 'आज' : 'Today'}</span>
                  </div>
                  <h2 className='mt-2 text-2xl font-bold'>{selectedCity}</h2>
                  <p className='mt-1 text-sm text-cyan-100'>{isHindi ? todayCond.hi : todayCond.en}</p>
                  <div className='mt-4 flex items-center gap-4'>
                    {today?.humidity != null && (
                      <div className='flex items-center gap-2'>
                        <Droplets className='h-5 w-5' />
                        <span className='text-sm'>{Math.round(today.humidity)}% {isHindi ? 'नमी' : 'Humidity'}</span>
                      </div>
                    )}
                    {today?.wind != null && (
                      <div className='flex items-center gap-2'>
                        <Wind className='h-5 w-5' />
                        <span className='text-sm'>{Math.round(today.wind)} km/h</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className='text-center'>
                  <todayCond.icon className='mx-auto h-20 w-20 text-yellow-300' />
                  <p className='mt-2 text-5xl font-extrabold'>{today?.temp != null ? `${Math.round(today.temp)}°C` : '—'}</p>
                  <p className='text-sm text-cyan-100'>
                    {today?.min != null && today?.max != null ? `${Math.round(today.min)}° - ${Math.round(today.max)}°C` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            <div className='mb-8'>
              <h3 className='mb-4 text-lg font-bold text-gray-900'>{isHindi ? '7-दिवसीय पूर्वानुमान' : '7-Day Forecast'}</h3>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7'>
                {wx.forecast.map((f, i) => {
                  const fc = cond(f.code)
                  const Icon = fc.icon
                  const mid = f.max != null && f.min != null ? Math.round((f.max + f.min) / 2) : f.max
                  return (
                    <div key={f.date || i} className='rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100'>
                      <p className='text-sm font-semibold text-gray-900'>{dayLabel(f.date, i, isHindi)}</p>
                      <Icon className='mx-auto my-3 h-10 w-10 text-blue-500' />
                      <p className='text-lg font-bold text-gray-900'>{mid != null ? `${Math.round(mid)}°` : '—'}</p>
                      <p className='text-xs text-gray-500'>
                        {f.min != null && f.max != null ? `${Math.round(f.min)}° - ${Math.round(f.max)}°` : ''}
                      </p>
                      {f.rain != null && (
                        <div className='mt-2 flex items-center justify-center gap-1 text-xs text-blue-500'>
                          <CloudRain className='h-3 w-3' />
                          {Math.round(f.rain)}%
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Farming advisory — generated server-side from the live readings */}
            {wx.advisory?.length > 0 && (
              <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
                <h3 className='mb-4 text-lg font-bold text-gray-900'>
                  {isHindi ? 'कृषि सलाह' : 'Farming Advisory'}
                </h3>
                <div className='space-y-3'>
                  {wx.advisory.map((a, i) => {
                    const s = ADVISORY_STYLE[a.icon] || ADVISORY_STYLE.thermometer
                    const Icon = s.icon
                    return (
                      <div key={i} className={`flex items-start gap-3 rounded-xl ${s.bg} p-4`}>
                        <Icon className={`h-5 w-5 flex-shrink-0 ${s.color}`} />
                        <p className='text-sm text-gray-700'>{isHindi ? a.hi : a.en}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  )
}
