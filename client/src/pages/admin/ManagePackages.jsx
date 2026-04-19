import { useState, useEffect } from 'react';
import { packageAPI } from '../../api/index.js';
import { Plus, Edit2, Trash2, Star, MapPin, Search, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadAPI } from '../../api/index.js';

const EMPTY_ITINERARY_DAY = { day: 1, title: '', description: '', accommodation: '', meals: '' };

const EMPTY_FORM = {
  title: '', destination: '', country: '', category: 'Adventure', description: '',
  price: '', duration: '', currency: 'NPR',
  highlights: '', includes: '', excludes: '', featured: false, isActive: true,
  images: [{ url: '', public_id: '' }],
  itinerary: [],
};

const CATEGORIES = ['Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Heritage', 'Pilgrimage'];
const VALID_TEXT_REGEX = /^[A-Za-z][A-Za-z0-9\s\-',()]*$/;

export default function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [itineraryOpen, setItineraryOpen] = useState(false);

  const addItineraryDay = () => {
    setForm((p) => ({
      ...p,
      itinerary: [...(p.itinerary || []), { ...EMPTY_ITINERARY_DAY, day: (p.itinerary?.length || 0) + 1 }],
    }));
  };

  const removeItineraryDay = (idx) => {
    setForm((p) => ({
      ...p,
      itinerary: p.itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })),
    }));
  };

  const updateItineraryDay = (idx, field, value) => {
    setForm((p) => {
      const updated = [...(p.itinerary || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...p, itinerary: updated };
    });
  };

  const fetchPackages = () => {
    packageAPI.getAll({ limit: 100 })
      .then(({ data }) => setPackages(data.packages))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      const { data } = await uploadAPI.uploadImages(formData);
      const newImages = data.images || [{ url: data.url, public_id: '' }];
      setForm((p) => ({
        ...p,
        images: [...(p.images?.filter((i) => i.url) || []), ...newImages],
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditPkg(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal(true);
  };

  const openEdit = (pkg) => {
    setEditPkg(pkg);
    setForm({
      ...pkg,
      highlights: pkg.highlights?.join('\n') || '',
      includes: pkg.includes?.join('\n') || '',
      excludes: pkg.excludes?.join('\n') || '',
      itinerary: pkg.itinerary || [],
    });
    setFormErrors({});
    setItineraryOpen((pkg.itinerary?.length || 0) > 0);
    setModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.title?.trim()) {
      errors.title = 'Title is required.';
    } else if (!VALID_TEXT_REGEX.test(form.title.trim())) {
      errors.title = 'Title must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses. No special symbols (@, %, #, $, etc.).';
    }

    if (!form.destination?.trim()) {
      errors.destination = 'Destination is required.';
    } else if (!VALID_TEXT_REGEX.test(form.destination.trim())) {
      errors.destination = 'Destination must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses. No special symbols (@, %, #, $, etc.).';
    }

    if (!form.country?.trim()) {
      errors.country = 'Country is required.';
    } else if (!VALID_TEXT_REGEX.test(form.country.trim())) {
      errors.country = 'Country must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses. No special symbols (@, %, #, $, etc.).';
    }

    if (!form.description?.trim()) {
      errors.description = 'Description is required.';
    } else if (!VALID_TEXT_REGEX.test(form.description.trim())) {
      errors.description = 'Description must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses. No special symbols (@, %, #, $, etc.).';
    }
    if (!form.price || Number(form.price) < 0) errors.price = 'Price must be 0 or greater.';
    if (!form.duration || Number(form.duration) < 1) errors.duration = 'Duration must be at least 1 day.';

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
        includes: form.includes ? form.includes.split('\n').filter(Boolean) : [],
        excludes: form.excludes ? form.excludes.split('\n').filter(Boolean) : [],
        images: form.images?.filter((i) => i.url) || [],
        itinerary: (form.itinerary || []).filter((d) => d.title && d.description),
      };

      if (editPkg) {
        await packageAPI.update(editPkg._id, payload);
      } else {
        await packageAPI.create(payload);
      }
      fetchPackages();
      setModal(false);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach((item) => {
          if (item?.field) mapped[item.field] = item.message;
        });
        setFormErrors(mapped);
      }
      alert(err.response?.data?.message || 'Error saving package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this package?')) return;
    try {
      await packageAPI.delete(id);
      setPackages((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = packages.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Manage Packages</h1>
          <p className="text-sm text-gray-500">{packages.length} total packages</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages..." className="input pl-9" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Package', 'Category', 'Price', 'Rating', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={pkg.images?.[0]?.url || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=100&q=70'}
                        alt={pkg.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">{pkg.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{pkg.destination}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{pkg.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">NPR {pkg.price?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      {pkg.rating?.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {pkg.featured && <span className="badge bg-yellow-100 text-yellow-700 text-xs ml-1">Featured</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(pkg)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(pkg._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No packages found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-display text-xl font-bold text-gray-900">{editPkg ? 'Edit Package' : 'New Package'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, title: value }));
                      setFormErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    className="input"
                    required
                  />
                  {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Destination *</label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, destination: value }));
                      setFormErrors((prev) => ({ ...prev, destination: '' }));
                    }}
                    className="input"
                    required
                  />
                  {formErrors.destination && <p className="text-xs text-red-600 mt-1">{formErrors.destination}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Country *</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, country: value }));
                      setFormErrors((prev) => ({ ...prev, country: '' }));
                    }}
                    className="input"
                    required
                  />
                  {formErrors.country && <p className="text-xs text-red-600 mt-1">{formErrors.country}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Category *</label>
                  <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="input">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Price (NPR) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, price: value }));
                      setFormErrors((prev) => ({ ...prev, price: '' }));
                    }}
                    className="input"
                    required
                    min={0}
                  />
                  {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (days) *</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, duration: value }));
                      setFormErrors((prev) => ({ ...prev, duration: '' }));
                    }}
                    className="input"
                    required
                    min={1}
                  />
                  {formErrors.duration && <p className="text-xs text-red-600 mt-1">{formErrors.duration}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Package Images</label>
                  <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-xl p-3 transition-colors ${uploadingImages ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
                    <Upload className={`w-4 h-4 ${uploadingImages ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} />
                    <span className="text-sm text-gray-500">{uploadingImages ? 'Uploading to Cloudinary…' : 'Click to upload images (JPG, PNG, WebP)'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>
                  {form.images?.filter((i) => i.url).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {form.images.filter((i) => i.url).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((p) => ({ ...p, description: value }));
                      setFormErrors((prev) => ({ ...prev, description: '' }));
                    }}
                    className="input resize-none"
                    rows={3}
                    required
                  />
                  {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
                </div>

                {/* Itinerary */}
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => setItineraryOpen((o) => !o)}
                    className="flex items-center justify-between w-full text-xs font-medium text-gray-600 mb-2 hover:text-primary-600 transition-colors"
                  >
                    <span>Itinerary <span className="text-gray-400 font-normal">({form.itinerary?.length || 0} days)</span></span>
                    {itineraryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {itineraryOpen && (
                    <div className="space-y-3">
                      {(form.itinerary || []).map((day, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-primary-600">Day {day.day}</span>
                            <button type="button" onClick={() => removeItineraryDay(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="Day title (e.g. Arrival in Kathmandu)"
                                value={day.title}
                                onChange={(e) => updateItineraryDay(idx, 'title', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <textarea
                                placeholder="Day description / activities"
                                value={day.description}
                                onChange={(e) => updateItineraryDay(idx, 'description', e.target.value)}
                                className="input resize-none text-sm"
                                rows={2}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Accommodation"
                                value={day.accommodation}
                                onChange={(e) => updateItineraryDay(idx, 'accommodation', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Meals (e.g. Breakfast, Dinner)"
                                value={day.meals}
                                onChange={(e) => updateItineraryDay(idx, 'meals', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addItineraryDay}
                        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <Plus className="w-4 h-4" /> Add Day
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Highlights (one per line)</label>
                  <textarea value={form.highlights} onChange={(e) => setForm(p => ({ ...p, highlights: e.target.value }))} className="input resize-none" rows={3} placeholder="Highlight 1&#10;Highlight 2" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Includes (one per line)</label>
                  <textarea value={form.includes} onChange={(e) => setForm(p => ({ ...p, includes: e.target.value }))} className="input resize-none" rows={3} placeholder="Hotel&#10;Breakfast" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Excludes (one per line)</label>
                  <textarea value={form.excludes} onChange={(e) => setForm(p => ({ ...p, excludes: e.target.value }))} className="input resize-none" rows={3} placeholder="Flights&#10;Visa" />
                </div>
                <div className="flex flex-col gap-3 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-700">Featured Package</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                  {submitting ? 'Saving...' : editPkg ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
