import Package from '../models/Package.model.js';

const contentRecommendationTours = (tours, keyword) => {
  const searchTerm = keyword.toLowerCase();
  const tokens = searchTerm.split(/\s+/).filter(Boolean);

  const scored = tours
    .map((tour) => {
      const titleText = (tour.title || '').toLowerCase();
      const destinationText = (tour.destination || '').toLowerCase();
      const countryText = (tour.country || '').toLowerCase();
      const categoryText = (tour.category || '').toLowerCase();
      const descriptionText = (tour.description || '').toLowerCase();

      let score = 0;
      if (titleText.includes(searchTerm)) score += 8;
      if (destinationText.includes(searchTerm)) score += 6;

      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (titleText.includes(token)) score += 5;
        if (destinationText.includes(token)) score += 4;
        if (countryText.includes(token)) score += 3;
        if (categoryText.includes(token)) score += 2;
        if (descriptionText.includes(token)) score += 1;
      }

      return { tour, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.tour);

  return scored;
};

const rateCalculationSortToursByPrice = (tours, order) => {
  const getRate = (tour) => {
    const price = Number(tour.price) || 0;
    return order === 'asc' ? -price : price;
  };

  return [...tours].sort((a, b) => getRate(b) - getRate(a));
};

// @desc    Get all tours with content recommendation and rate-calculation sorting
// @route   GET /api/packages
export const getTours = async (req, res) => {
  try {
    const searchKeyword = (req.query.search || '').trim();
    const sortPrice = req.query.sortPrice;

    const allTours = await Package.find({ isActive: true }).sort('-createdAt');

    let filteredTours = allTours;
    if (searchKeyword) {
      filteredTours = contentRecommendationTours(allTours, searchKeyword);
    }

    if (sortPrice === 'asc' || sortPrice === 'desc') {
      filteredTours = rateCalculationSortToursByPrice(filteredTours, sortPrice);
    }

    res.json({
      success: true,
      total: filteredTours.length,
      packages: filteredTours,
      pages: 1,
    });
  } catch (error) {
    console.error('getTours error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tours.' });
  }
};

export const getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, package: pkg });
  } catch (error) {
    console.error('getPackageById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch package.' });
  }
};

export const createPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({ success: true, message: 'Package created', package: pkg });
  } catch (error) {
    console.error('createPackage error:', error);
    res.status(400).json({ success: false, message: 'Failed to create package.' });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package updated', package: pkg });
  } catch (error) {
    console.error('updatePackage error:', error);
    res.status(400).json({ success: false, message: 'Failed to update package.' });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package deleted' });
  } catch (error) {
    console.error('deletePackage error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete package.' });
  }
};

export const getFeaturedPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true, featured: true }).limit(6);
    res.json({ success: true, packages });
  } catch (error) {
    console.error('getFeaturedPackages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured packages.' });
  }
};

export const getAllPackagesAdmin = async (req, res) => {
  try {
    const packages = await Package.find().sort('-createdAt');
    res.json({ success: true, packages });
  } catch (error) {
    console.error('getAllPackagesAdmin error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch packages.' });
  }
};