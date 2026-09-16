import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { formatArabicDate } from '../../lib/utils';
import { 
  Bus, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Users, 
  AlertCircle,
  Clock3
} from 'lucide-react';
import { Trip, ChurchEvent } from '../../types';

export const YouthActivities: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'trips' | 'events'>('trips');
  const [trips, setTrips] = useState<Trip[]>(dataStore.trips);
  const [events] = useState<ChurchEvent[]>(dataStore.events);
  const [bookingMessage, setBookingMessage] = useState<{ id: string; msg: string; isSuccess: boolean } | null>(null);

  const userBookings = dataStore.tripBookings.filter((b) => b.userId === currentUser?.userId);
  const bookedTripIds = new Set(userBookings.map((b) => b.tripId));

  const handleBookTrip = async (tripId: string) => {
    if (!currentUser) return;

    const res = await dataStore.bookTrip(tripId, currentUser);
    setTrips([...dataStore.trips]);
    setBookingMessage({
      id: tripId,
      msg: res.message,
      isSuccess: res.success,
    });

    setTimeout(() => {
      setBookingMessage(null);
    }, 4000);
  };

  return (
    <div id="youth-activities-view" className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">الأنشطة والرحلات</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          رحلات الأديرة، الأيام الروحية، والأنشطة الشبابية
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'trips'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>رحلات الأديرة والترفيه ({trips.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'events'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>الأيام والمؤتمرات ({events.length})</span>
        </button>
      </div>

      {/* TRIPS SECTION */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {trips.map((trip) => {
            const isBooked = bookedTripIds.has(trip.tripId);
            const remainingSeats = Math.max(0, trip.capacity - trip.bookedSeatsCount);
            const isFull = remainingSeats <= 0;
            const booking = userBookings.find((b) => b.tripId === trip.tripId);

            return (
              <div
                key={trip.tripId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {trip.imageUrl && (
                  <div className="h-44 sm:h-52 w-full relative overflow-hidden">
                    <img
                      src={trip.imageUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Floating Badges on Image */}
                    <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
                      <span className="font-bold text-lg bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl">
                        {trip.price} ج.م
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold backdrop-blur-md ${
                        isFull 
                          ? 'bg-rose-600/90 text-white' 
                          : remainingSeats <= 15 
                          ? 'bg-amber-500/90 text-white' 
                          : 'bg-emerald-600/90 text-white'
                      }`}>
                        {isFull ? 'المقاعد مكتملة (قائمة انتظار)' : `متبقي ${remainingSeats} مقعد من ${trip.capacity}`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {trip.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {trip.description}
                    </p>
                  </div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>الموعد: <strong>{formatArabicDate(trip.date)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>التجمع: <strong>{trip.time}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>نقطة التحرك: <strong>{trip.meetingPoint}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>المسؤول: <strong>{trip.coordinatorName}</strong></span>
                    </div>
                  </div>

                  {/* Destinations Pills */}
                  {trip.destinations && trip.destinations.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1.5">أبرز المحطات والزيارات:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {trip.destinations.map((dest, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                          >
                            {dest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                    
                    {/* WhatsApp Coordinator Button */}
                    <a
                      href={`https://wa.me/${trip.coordinatorWhatsapp}?text=${encodeURIComponent(`سلام، أود الاستفسار بخصوص ${trip.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تواصل مع مسؤول الحجز (واتساب)</span>
                    </a>

                    {/* Booking Action */}
                    <div className="w-full sm:w-auto">
                      {isBooked ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            {booking?.status === 'confirmed'
                              ? 'تم تأكيد حجزك ودفع الاشتراك ✓'
                              : booking?.status === 'waitlist'
                              ? 'في قائمة الانتظار'
                              : 'تم حجز مقعدك (في انتظار تأكيد الدفع)'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBookTrip(trip.tripId)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition"
                        >
                          {isFull ? 'الانضمام لقائمة الانتظار' : 'احجز مقعدك الآن'}
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Inline Alert Message */}
                  {bookingMessage && bookingMessage.id === trip.tripId && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      bookingMessage.isSuccess
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{bookingMessage.msg}</span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENTS SECTION */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-bold mb-1.5 inline-block">
                    {event.type === 'spiritual_day' ? 'يوم روحي' : 'نشاط شبابي'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                </div>

                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl shrink-0">
                  {event.price === 0 ? 'مجاناً' : `${event.price} ج.م`}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {event.description}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{formatArabicDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
