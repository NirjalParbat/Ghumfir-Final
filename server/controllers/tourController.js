import Package from '../models/Package.model.js';

const linearSearchTours = (tours, keyword) => {
  const matches = [];
  const searchTerm = keyword.toLowerCase();

  console.log(`[LinearSearch] Searching for: "${searchTerm}"`);

  tours.forEach((tour, index) => {
    const titleText = (tour.title || '').toLowerCase();
    const locationText = (tour.destination || '').toLowerCase();
    const titleMatch = titleText.includes(searchTerm);
    const locationMatch = locationText.includes(searchTerm);

    console.log(
      `[LinearSearch] Compare ${index + 1}: title="${tour.title}" destination="${tour.destination}" -> titleMatch=${titleMatch}, locationMatch=${locationMatch}`
    );

    if (titleMatch || locationMatch) {
      console.log(`[LinearSearch] Match found: ${tour.title}`);
      matches.push(tour);
    }
  });

  return matches;
};

const bubbleSortToursByPrice = (tours, order) => {
  const sortedTours = [...tours];
  const shouldSortAscending = order === 'asc';

  console.log(`[BubbleSort] Sorting by price in ${order} order`);

  for (let i = 0; i < sortedTours.length - 1; i += 1) {
    for (let j = 0; j < sortedTours.length - i - 1; j += 1) {
      const leftPrice = Number(sortedTours[j].price);
      const rightPrice = Number(sortedTours[j + 1].price);
      const shouldSwap = shouldSortAscending ? leftPrice > rightPrice : leftPrice < rightPrice;

      console.log(
        `[BubbleSort] Compare ${j + 1}: ${sortedTours[j].title} (${leftPrice}) vs ${sortedTours[j + 1].title} (${rightPrice}) -> swap=${shouldSwap}`
      );

      if (shouldSwap) {
        console.log(`[BubbleSort] Swap: ${sortedTours[j].title} <-> ${sortedTours[j + 1].title}`);
        const temp = sortedTours[j];
        sortedTours[j] = sortedTours[j + 1];
        sortedTours[j + 1] = temp;
      }
    }
  }

  return sortedTours;
};

// @desc    Get all tours with linear search and bubble sort
// @route   GET /api/packages
export const getTours = async (req, res) => {
  try {
    const searchKeyword = (req.query.search || '').trim();
    const sortPrice = req.query.sortPrice;

    const allTours = await Package.find({ isActive: true }).sort('-createdAt');

    let filteredTours = allTours;
    if (searchKeyword) {
      filteredTours = linearSearchTours(allTours, searchKeyword);
    }

    if (sortPrice === 'asc' || sortPrice === 'desc') {
      filteredTours = bubbleSortToursByPrice(filteredTours, sortPrice);
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