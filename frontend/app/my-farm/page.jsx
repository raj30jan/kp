'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, MapPin, Calendar, Droplets, Plus, Edit, Trash2, X, Loader2, Package } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const t = {
  en: {
    title: 'My Farm', sub: 'Manage your farm plots and crops', addPlot: 'Add Plot',
    totalPlots: 'Total Plots', acresTotal: 'Acres Total', activeCrops: 'Active Crops', waterSources: 'Water Sources',
    empty: 'No farm plots yet. Add your first plot to start tracking crops, soil and irrigation.',
    loadError: 'Could not load your farm plots', saveFail: 'Save failed',
    currentCrop: 'Current Crop', soilType: 'Soil Type', sownDate: 'Sown Date', harvest: 'Harvest',
    irrigation: 'Irrigation', notes: 'Notes',
    editPlot: 'Edit Plot', plotName: 'Plot Name *', plotNamePh: 'e.g. Farm Plot A',
    area: 'Area', unit: 'Unit', location: 'Location', locationPh: 'Village / area',
    district: 'District', state: 'State', cropPh: 'Wheat (HD-2967)', soilPh: 'Loamy', irrigationPh: 'Tube well',
    expectedHarvest: 'Expected Harvest', cancel: 'Cancel', saving: 'Saving…', saveChanges: 'Save Changes',
  },
  hi: {
    title: 'मेरा फ़ार्म', sub: 'अपने फ़ार्म प्लॉट और फसलें प्रबंधित करें', addPlot: 'प्लॉट जोड़ें',
    totalPlots: 'कुल प्लॉट', acresTotal: 'कुल एकड़', activeCrops: 'सक्रिय फसलें', waterSources: 'जल स्रोत',
    empty: 'अभी कोई फ़ार्म प्लॉट नहीं। फसल, मिट्टी और सिंचाई ट्रैक करने के लिए अपना पहला प्लॉट जोड़ें।',
    loadError: 'आपके फ़ार्म प्लॉट लोड नहीं हो सके', saveFail: 'सहेजने में विफल',
    currentCrop: 'वर्तमान फसल', soilType: 'मिट्टी का प्रकार', sownDate: 'बुवाई तिथि', harvest: 'कटाई',
    irrigation: 'सिंचाई', notes: 'नोट्स',
    editPlot: 'प्लॉट संपादित करें', plotName: 'प्लॉट का नाम *', plotNamePh: 'जैसे फ़ार्म प्लॉट A',
    area: 'क्षेत्रफल', unit: 'इकाई', location: 'स्थान', locationPh: 'गाँव / क्षेत्र',
    district: 'ज़िला', state: 'राज्य', cropPh: 'गेहूँ (HD-2967)', soilPh: 'दोमट', irrigationPh: 'ट्यूबवेल',
    expectedHarvest: 'अपेक्षित कटाई', cancel: 'रद्द करें', saving: 'सहेजा जा रहा है…', saveChanges: 'बदलाव सहेजें',
  },
}

const EMPTY_FORM = {
  name: '', area: '', areaUnit: 'acres', location: '', state: '', district: '',
  crop: '', soilType: '', irrigation: '', sownDate: '', expectedHarvest: '', notes: '',
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default function MyFarmPage() {
  const router = useRouter()
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // farm being edited, null = add
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState('')

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null)

  const load = () => {
    const t = token()
    if (!t) {
      router.replace('/login?next=/my-farm')
      return
    }
    setLoading(true)
    api.getMyFarms(t)
      .then((rows) => setFarms(Array.isArray(rows) ? rows : []))
      .catch(() => setError(text.loadError))
      .finally(() => setLoading(false))
  }

  useEffect(load, [router])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (f) => {
    setEditing(f)
    setForm({
      name: f.name || '', area: f.area ?? '', areaUnit: f.areaUnit || 'acres',
      location: f.location || '', state: f.state || '', district: f.district || '',
      crop: f.crop || '', soilType: f.soilType || '', irrigation: f.irrigation || '',
      sownDate: f.sownDate ? String(f.sownDate).slice(0, 10) : '',
      expectedHarvest: f.expectedHarvest ? String(f.expectedHarvest).slice(0, 10) : '',
      notes: f.notes || '',
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    const t = token()
    if (!t) return
    setSaving(true)
    const body = {
      name: form.name.trim(),
      ...(form.area !== '' ? { area: Number(form.area) } : {}),
      areaUnit: form.areaUnit,
      ...(form.location ? { location: form.location } : {}),
      ...(form.state ? { state: form.state } : {}),
      ...(form.district ? { district: form.district } : {}),
      ...(form.crop ? { crop: form.crop } : {}),
      ...(form.soilType ? { soilType: form.soilType } : {}),
      ...(form.irrigation ? { irrigation: form.irrigation } : {}),
      ...(form.sownDate ? { sownDate: form.sownDate } : {}),
      ...(form.expectedHarvest ? { expectedHarvest: form.expectedHarvest } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    }
    try {
      if (editing) await api.updateFarm(editing.id, body, t)
      else await api.createFarm(body, t)
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.message || text.saveFail)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (f) => {
    const t = token()
    if (!t) return
    setDeleting(f.id)
    try {
      await api.deleteFarm(f.id, t)
      setFarms((list) => list.filter((x) => x.id !== f.id))
    } catch {} finally { setDeleting('') }
  }

  const totalAcres = farms.reduce((s, f) => s + (Number(f.area) || 0), 0)
  const activeCrops = farms.filter((f) => f.crop).length
  const waterSources = farms.filter((f) => f.irrigation).length

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>{text.title}</h1>
                <p className='text-sm text-gray-500'>{text.sub}</p>
              </div>
              <button onClick={openAdd} className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700'>
                <Plus className='h-4 w-4' /> {text.addPlot}
              </button>
            </div>

            {error && <div className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</div>}

            {/* Summary */}
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Sprout className='h-6 w-6 text-emerald-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{farms.length}</p>
                <p className='text-xs text-gray-500'>{text.totalPlots}</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <MapPin className='h-6 w-6 text-blue-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{totalAcres.toLocaleString('en-IN')}</p>
                <p className='text-xs text-gray-500'>{text.acresTotal}</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Calendar className='h-6 w-6 text-amber-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{activeCrops}</p>
                <p className='text-xs text-gray-500'>{text.activeCrops}</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Droplets className='h-6 w-6 text-cyan-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{waterSources}</p>
                <p className='text-xs text-gray-500'>{text.waterSources}</p>
              </div>
            </div>

            {/* Plots */}
            {loading ? (
              <div className='flex items-center justify-center py-16'><Loader2 className='h-8 w-8 animate-spin text-emerald-600' /></div>
            ) : farms.length === 0 ? (
              <div className='flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
                <Package className='h-12 w-12 text-gray-300' />
                <p className='mt-4 max-w-sm text-sm text-gray-500'>{text.empty}</p>
                <button onClick={openAdd} className='mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'>{text.addPlot}</button>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {farms.map((f) => (
                  <div key={f.id} className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50'>
                          <Sprout className='h-6 w-6 text-emerald-700' />
                        </div>
                        <div>
                          <h3 className='text-lg font-bold text-gray-900'>{f.name}</h3>
                          <p className='text-sm text-gray-500'>
                            {f.area ? `${f.area} ${f.areaUnit || 'acres'}` : ''}
                            {f.area && (f.location || f.district || f.state) ? ' · ' : ''}
                            {f.location || [f.district, f.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <button onClick={() => openEdit(f)} className='rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100'><Edit className='h-4 w-4' /></button>
                        <button onClick={() => remove(f)} disabled={deleting === f.id} className='rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50'>
                          {deleting === f.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                        </button>
                      </div>
                    </div>

                    <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                      <div><p className='text-xs font-medium text-gray-500'>{text.currentCrop}</p><p className='font-semibold text-gray-900'>{f.crop || '—'}</p></div>
                      <div><p className='text-xs font-medium text-gray-500'>{text.soilType}</p><p className='font-semibold text-gray-900'>{f.soilType || '—'}</p></div>
                      <div><p className='text-xs font-medium text-gray-500'>{text.sownDate}</p><p className='font-semibold text-gray-900'>{fmtDate(f.sownDate)}</p></div>
                      <div><p className='text-xs font-medium text-gray-500'>{text.harvest}</p><p className='font-semibold text-gray-900'>{fmtDate(f.expectedHarvest)}</p></div>
                      <div className='col-span-2'><p className='text-xs font-medium text-gray-500'>{text.irrigation}</p><p className='font-semibold text-gray-900'>{f.irrigation || '—'}</p></div>
                      {f.notes && <div className='col-span-2'><p className='text-xs font-medium text-gray-500'>{text.notes}</p><p className='text-gray-700'>{f.notes}</p></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setModalOpen(false)}>
          <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-bold text-gray-900'>{editing ? text.editPlot : text.addPlot}</h2>
              <button onClick={() => setModalOpen(false)} className='rounded-lg p-1 text-gray-400 hover:bg-gray-100'><X className='h-5 w-5' /></button>
            </div>
            <form onSubmit={save} className='grid grid-cols-2 gap-3'>
              <div className='col-span-2'><label className={labelCls}>{text.plotName}</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder={text.plotNamePh} /></div>
              <div><label className={labelCls}>{text.area}</label><input type='number' step='0.01' min='0' value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} placeholder='5' /></div>
              <div><label className={labelCls}>{text.unit}</label>
                <select value={form.areaUnit} onChange={(e) => setForm({ ...form, areaUnit: e.target.value })} className={inputCls}>
                  <option value='acres'>acres</option><option value='hectares'>hectares</option><option value='bigha'>bigha</option>
                </select>
              </div>
              <div className='col-span-2'><label className={labelCls}>{text.location}</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder={text.locationPh} /></div>
              <div><label className={labelCls}>{text.district}</label><input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>{text.state}</label><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>{text.currentCrop}</label><input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className={inputCls} placeholder={text.cropPh} /></div>
              <div><label className={labelCls}>{text.soilType}</label><input value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })} className={inputCls} placeholder={text.soilPh} /></div>
              <div><label className={labelCls}>{text.irrigation}</label><input value={form.irrigation} onChange={(e) => setForm({ ...form, irrigation: e.target.value })} className={inputCls} placeholder={text.irrigationPh} /></div>
              <div><label className={labelCls}>{text.sownDate}</label><input type='date' value={form.sownDate} onChange={(e) => setForm({ ...form, sownDate: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>{text.expectedHarvest}</label><input type='date' value={form.expectedHarvest} onChange={(e) => setForm({ ...form, expectedHarvest: e.target.value })} className={inputCls} /></div>
              <div className='col-span-2'><label className={labelCls}>{text.notes}</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
              <div className='col-span-2 mt-2 flex gap-2'>
                <button type='button' onClick={() => setModalOpen(false)} className='flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50'>{text.cancel}</button>
                <button type='submit' disabled={saving} className='flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'>
                  {saving ? text.saving : editing ? text.saveChanges : text.addPlot}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
