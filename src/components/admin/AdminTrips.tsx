import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { formatArabicDate, downloadCSV } from '../../lib/utils';
import { 
  Bus, 
  Plus, 
  Users, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { Trip, TripBooking } from '../../types';

export const AdminTrips: React.FC = () => {
  const { role } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(dataStore.trips);
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.tripId || '');
  const [notice, setNotice] = useState<string | null>(null);

  // New Trip modal
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-02');
  const [newPrice, setNewPrice] = useState(250);
  const [newCapacity, setNewCapacity] = useState(50);
  const [newDesc, setNewDesc] = useState('');
  const [newCoordinator, setNewCoordinator] = useState('خ. بيتر عادل');
  const [newWhatsapp, setNewWhatsapp] = useState('201288889900');

  const selectedTrip = trips.find((t) => t.tripId === selectedTripId) || trips[0];
  const bookings = dataStore.tripBookings.filter((b) => b.tripId === selectedTripId);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const trip: Trip = {
      tripId: `trip_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'رحلة روحية وترفيهية لشباب الاجتماع',
      date: newDate,
      time: '06:30 صباحاً',
      meetingPoint: 'أمام فناء الكنيسة الرئيسي',
      destinations: ['دير الأنبا بيشوي', 'دير السريان', 'فقرة ترفيهية'],
      price: Number(newPrice),
      capacity: Number(newCapacity),
      bookedSeatsCount: 0,
      status: 'open',
      coordinatorName: newCoordinator,
      coordinatorWhatsapp: newWhatsapp,
      createdAt: new Date().toISOString(),
    };

    await dataStore.createTrip(trip);
    setTrips([...dataStore.trips]);
    setShowNewTripModal(false);
    setSelectedTripId(trip.tripId);
    setNotice(`تم إنشاء رحلة ${trip.title} بنجاح`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'pending' | 'waitlist' | 'cancelled') => {
    const b = dataStore.tripBookings.find((item) => item.bookingId === bookingId);
    if (!b) return;

    b.status = newStatus;
    b.updatedAt = new Date().toISOString();
    setTrips([...dataStore.trips]);
    setNotice('تم تحديث حالة اشتراك الراكب');
    setTimeout(() => setNotice(null), 2500);
  };

  const handleExportManifest = () => {
    if (!selectedTrip) return;

    const rows = bookings.map((b, i) => ({
      'رقم المقعد': i + 1,
      'الكود': b.userCode,
      'اسم المشترك': b.userName,
      'رقم الهاتف': b.phoneNumber,
      'حالة الدفع والاشتراك': b.status === 'confirmed' ? 'مدفوع ومؤكد' : b.status === 'waitlist' ? 'قائمة انتظار' : 'في انتظار الدفع',
      'تاريخ الحجز': b.bookedAt.split('T')[0],
    }));

    downloadCSV(rows, `مانيفست_ركاب_${selectedTrip.title}.csv`);
  };

  return (
    <div id="admin-trips-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-indigo-600" />
            إدارة الرحلات وحجوزات الأتوبيسات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مراقبة سعة المقاعد، تأكيد سداد الاشتراكات، واستخراج كشوف الأتوبيسات المعتمدة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role === 'admin' && (
            <button
              onClick={() => setShowNewTripModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رحلة جديدة (أمين الخدمة)</span>
            </button>
          )}

          <button
            onClick={handleExportManifest}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير كشف الأتوبيس (CSV)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Trip Cards Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip, idx) => {
          const isSelected = trip.tripId === selectedTripId;
          const remaining = trip.capacity - trip.bookedSeatsCount;

          return (
            <div
              key={trip.tripId || `trip_${idx}`}
              onClick={() => setSelectedTripId(trip.tripId)}
              className={`p-5 rounded-3xl border transition cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    {formatArabicDate(trip.date)}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {trip.title}
                  </h3>
                </div>

                <span className="font-black text-indigo-600 text-base">
                  {trip.price} ج.م
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>محجوز: {trip.bookedSeatsCount} من أصل {trip.capacity}</span>
                </div>

                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  remaining <= 10 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  متبقي {remaining} مقعد
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Trip Passenger Manifest Table */}
      {selectedTrip && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                كشف ركاب رحلة: {selectedTrip.title}
              </h3>
              <p className="text-xs text-slate-500">
                إجمالي المسجلين: {bookings.length} مشترك
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">مسؤول الحجز: {selectedTrip.coordinatorName}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-start">م</th>
                  <th className="py-3.5 px-4 text-start">الكود الكنسي</th>
                  <th className="py-3.5 px-4 text-start">اسم المشترك</th>
                  <th className="py-3.5 px-4 text-start">رقم الهاتف</th>
                  <th className="py-3.5 px-4 text-start">حالة الاشتراك</th>
                  <th className="py-3.5 px-4 text-center">تعديل الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد حجوزات مسجلة لهذه الرحلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, idx) => (
                    <tr key={booking.bookingId || `bk_${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {booking.userCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {booking.userName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {booking.phoneNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : booking.status === 'waitlist'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status === 'confirmed'
                            ? 'تم التأكيد وسداد الاشتراك'
                            : booking.status === 'waitlist'
                            ? 'في قائمة الانتظار'
                            : 'حجز مبدئي (في انتظار الدفع)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {booking.status !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.bookingId, 'confirmed')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition border border-emerald-200"
                            >
                              تأكيد السداد
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.bookingId, 'pending')}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-medium transition"
                            >
                              تعيين كمعلق
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW TRIP MODAL */}
      {showNewTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              إضافة رحلة جديدة
            </h3>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">عنوان الرحلة</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: رحلة دير الأنبا بولا والأنبا أنطونيوس"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">تاريخ الرحلة</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">قيمة الاشتراك (ج.م)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">سعة المقاعد الكلية</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">الخادم المسؤول</label>
                  <input
                    type="text"
                    value={newCoordinator}
                    onChange={(e) => setNewCoordinator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">رقم واتساب المسؤول للاستفسارات</label>
                <input
                  type="text"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  نشر الرحلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
