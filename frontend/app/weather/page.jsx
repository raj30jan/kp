'use client'

import { useState } from 'react'
import { CloudSun, CloudRain, Sun, Cloud, Droplets, Wind, Thermometer, MapPin, Calendar } from 'lucide-react'

export default function WeatherPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [selectedCity, setSelectedCity] = useState('Ludhiana')

  const cities = ['Ludhiana', 'Amritsar', 'Chandigarh', 'Delhi', 'Jaipur', 'Lucknow', 'Bhopal', 'Patna']

  const forecast = [
    { day: isHindi ? 'आज' : 'Today', icon: Sun, temp: 32, min: 22, max: 34, condition: isHindi ? 'धूप' : 'Sunny', rain: 0, wind: 12, humidity: 45 },
    { day: isHindi ? 'मंगल' : 'Tue', icon: Cloud, temp: 30, min: 21, max: 32, condition: isHindi ? 'बादल' : 'Cloudy', rain: 10, wind: 15, humidity: 55 },
    { day: isHindi ? 'बुध' : 'Wed', icon: CloudRain, temp: 28, min: 20, max: 30, condition: isHindi ? 'बारिश' : 'Rain', rain: 80, wind: 22, humidity: 75 },
    { day: isHindi ? 'गुरु' : 'Thu', icon: CloudRain, temp: 27, min: 19, max: 29, condition: isHindi ? 'बारिश' : 'Rain', rain: 65, wind: 18, humidity: 70 },
    { day: isHindi ? 'शुक्र' : 'Fri', icon: Cloud, temp: 29, min: 20, max: 31, condition: isHindi ? 'बादल' : 'Cloudy', rain: 20, wind: 14, humidity: 60 },
    { day: isHindi ? 'शनि' : 'Sat', icon: Sun, temp: 31, min: 22, max: 33, condition: isHindi ? 'धूप' : 'Sunny', rain: 5, wind: 10, humidity: 50 },
    { day: isHindi ? 'रवि' : 'Sun', icon: Sun, temp: 33, min: 23, max: 35, condition: isHindi ? 'धूप' : 'Sunny', rain: 0, wind: 8, humidity: 42 },
  ]

  const today = forecast[0]

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

        {/* Today's weather card */}
        <div className='mb-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white shadow-lg'>
          <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
            <div>
              <div className='flex items-center gap-2 text-cyan-100'>
                <Calendar className='h-4 w-4' />
                <span className='text-sm'>{isHindi ? 'आज' : 'Today'}</span>
              </div>
              <h2 className='mt-2 text-2xl font-bold'>{selectedCity}</h2>
              <p className='mt-1 text-sm text-cyan-100'>{today.condition}</p>
              <div className='mt-4 flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Droplets className='h-5 w-5' />
                  <span className='text-sm'>{today.humidity}% {isHindi ? 'नमी' : 'Humidity'}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Wind className='h-5 w-5' />
                  <span className='text-sm'>{today.wind} km/h</span>
                </div>
              </div>
            </div>
            <div className='text-center'>
              <Sun className='mx-auto h-20 w-20 text-yellow-300' />
              <p className='mt-2 text-5xl font-extrabold'>{today.temp}°C</p>
              <p className='text-sm text-cyan-100'>{today.min}° - {today.max}°C</p>
            </div>
          </div>
        </div>

        {/* 7-day forecast */}
        <div className='mb-8'>
          <h3 className='mb-4 text-lg font-bold text-gray-900'>{isHindi ? '7-दिवसीय पूर्वानुमान' : '7-Day Forecast'}</h3>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7'>
            {forecast.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.day} className='rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100'>
                  <p className='text-sm font-semibold text-gray-900'>{f.day}</p>
                  <Icon className='mx-auto my-3 h-10 w-10 text-blue-500' />
                  <p className='text-lg font-bold text-gray-900'>{f.temp}°</p>
                  <p className='text-xs text-gray-500'>{f.min}° - {f.max}°</p>
                  <div className='mt-2 flex items-center justify-center gap-1 text-xs text-blue-500'>
                    <CloudRain className='h-3 w-3' />
                    {f.rain}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Farming advisory */}
        <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
          <h3 className='mb-4 text-lg font-bold text-gray-900'>
            {isHindi ? 'कृषि सलाह' : 'Farming Advisory'}
          </h3>
          <div className='space-y-3'>
            <div className='flex items-start gap-3 rounded-xl bg-amber-50 p-4'>
              <Thermometer className='h-5 w-5 flex-shrink-0 text-amber-600' />
              <p className='text-sm text-gray-700'>
                {isHindi
                  ? 'तापमान 32°C है। गेहूं की कटाई के लिए अनुकूल मौसम। सुबह के समय सिंचाई करें।'
                  : 'Temperature is 32°C. Favorable weather for wheat harvest. Irrigate in the morning.'}
              </p>
            </div>
            <div className='flex items-start gap-3 rounded-xl bg-blue-50 p-4'>
              <CloudRain className='h-5 w-5 flex-shrink-0 text-blue-600' />
              <p className='text-sm text-gray-700'>
                {isHindi
                  ? 'बुधवार को भारी बारिश की संभावना (80%)। फसल को ढकने की तैयारी करें।'
                  : 'Heavy rain expected on Wednesday (80%). Prepare to cover crops.'}
              </p>
            </div>
            <div className='flex items-start gap-3 rounded-xl bg-emerald-50 p-4'>
              <Wind className='h-5 w-5 flex-shrink-0 text-emerald-600' />
              <p className='text-sm text-gray-700'>
                {isHindi
                  ? 'हवा की गति 12-22 km/h रहेगी। कीटनाशक छिड़काव के लिए उपयुक्त नहीं।'
                  : 'Wind speed will be 12-22 km/h. Not suitable for pesticide spraying.'}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
