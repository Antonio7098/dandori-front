import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Grid, List, Upload, Layers } from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '../components/layout';
import { SearchBox, SearchFilters } from '../components/search';
import { CourseGrid } from '../components/courses';
import { Button, Modal, ModalFooter } from '../components/ui';
import { useSearchStore, useChatStore, useUserStore } from '../stores/useStore';
import { coursesApi } from '../services/api';
import styles from './SearchPage.module.css';

const DEFAULT_PRICE_RANGE = [0, 500];

const parseCostValue = (cost) => {
  if (typeof cost === 'number' && Number.isFinite(cost)) {
    return cost;
  }

  if (!cost) {
    return null;
  }

  const numeric = String(cost).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : null;
};

const getCourseTimestamp = (course) => {
  const dateValue = course?.updated_at || course?.created_at;
  if (!dateValue) {
    return 0;
  }
  const date = new Date(dateValue);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
};

const applyFiltersAndSorting = (courseList, filters = {}) => {
  if (!Array.isArray(courseList)) {
    return [];
  }

  const locationFilter = filters.location?.toLowerCase().trim();
  const courseTypeFilter = filters.courseType?.toLowerCase().trim();
  const priceRange = Array.isArray(filters.priceRange) ? filters.priceRange : DEFAULT_PRICE_RANGE;
  const [minPrice = DEFAULT_PRICE_RANGE[0], maxPrice = DEFAULT_PRICE_RANGE[1]] = priceRange;
  const hasPriceFilter = minPrice > DEFAULT_PRICE_RANGE[0] || maxPrice < DEFAULT_PRICE_RANGE[1];

  const filtered = courseList.filter((course) => {
    const courseLocation = course.location?.toLowerCase() || '';
    const courseType = course.course_type?.toLowerCase() || '';
    const costValue = parseCostValue(course.cost);

    const matchesLocation = !locationFilter || courseLocation.includes(locationFilter);
    const matchesCourseType = !courseTypeFilter || courseType.includes(courseTypeFilter);
    const matchesPrice = !hasPriceFilter || (costValue !== null && costValue >= minPrice && costValue <= maxPrice);

    return matchesLocation && matchesCourseType && matchesPrice;
  });

  const sortBy = filters.sortBy || 'relevance';
  if (sortBy === 'price_low') {
    return [...filtered].sort((a, b) => {
      const costA = parseCostValue(a.cost);
      const costB = parseCostValue(b.cost);
      return (costA ?? Number.POSITIVE_INFINITY) - (costB ?? Number.POSITIVE_INFINITY);
    });
  }

  if (sortBy === 'price_high') {
    return [...filtered].sort((a, b) => {
      const costA = parseCostValue(a.cost);
      const costB = parseCostValue(b.cost);
      return (costB ?? Number.NEGATIVE_INFINITY) - (costA ?? Number.NEGATIVE_INFINITY);
    });
  }

  if (sortBy === 'rating') {
    return [...filtered].sort((a, b) => {
      const ratingA = Number.parseFloat(a.rating ?? 0) || 0;
      const ratingB = Number.parseFloat(b.rating ?? 0) || 0;
      return ratingB - ratingA;
    });
  }

  if (sortBy === 'newest') {
    return [...filtered].sort((a, b) => getCourseTimestamp(b) - getCourseTimestamp(a));
  }

  return filtered;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState('single');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const { query, setQuery, filters, setSearching, setResults } = useSearchStore();
  const { openChat } = useChatStore();
  const user = useUserStore((state) => state.user);
  const isAdmin = Boolean(user?.email?.endsWith('@dandori.com'));

  const mergeFilters = useCallback(
    (overrides = {}) => ({
      ...filters,
      ...overrides,
    }),
    [filters]
  );

  const buildQueryParams = useCallback((activeFilters) => {
    const params = {};
    if (activeFilters.location) {
      params.location = activeFilters.location;
    }
    if (activeFilters.courseType) {
      params.course_type = activeFilters.courseType;
    }
    if (Array.isArray(activeFilters.priceRange)) {
      const [minPrice, maxPrice] = activeFilters.priceRange;
      if (typeof minPrice === 'number' && minPrice > DEFAULT_PRICE_RANGE[0]) {
        params.min_price = minPrice;
      }
      if (typeof maxPrice === 'number' && maxPrice < DEFAULT_PRICE_RANGE[1]) {
        params.max_price = maxPrice;
      }
    }
    if (activeFilters.sortBy && activeFilters.sortBy !== 'relevance') {
      params.sort_by = activeFilters.sortBy;
    }
    return params;
  }, []);

  const fetchCourses = useCallback(async (filterOverrides = {}) => {
    setIsLoading(true);
    try {
      const activeFilters = mergeFilters(filterOverrides);
      const params = buildQueryParams(activeFilters);

      const data = await coursesApi.getAll(params);
      const list = data.courses || data || [];
      const refined = applyFiltersAndSorting(list, activeFilters);
      setCourses(refined);
      if (!hasSearched) {
        setResults(refined);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, hasSearched, mergeFilters, setResults]);

  const handleSearch = useCallback(async (searchQuery, { silent = false } = {}) => {
    if (!searchQuery?.trim()) return;

    setIsLoading(true);
    setSearching(true);
    if (!silent) {
      setHasSearched(true);
    }

    try {
      const activeFilters = mergeFilters();
      const filterParams = buildQueryParams(activeFilters);
      const response = await coursesApi.search(searchQuery, {
        ...filterParams,
        n: 30,
      });

      const results = response.results || [];
      const refined = applyFiltersAndSorting(results, activeFilters);
      setCourses(refined);
      setResults(refined);

      if (!silent) {
        setSearchParams({ q: searchQuery });
      }
    } catch (error) {
      console.error('Search failed:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
      setSearching(false);
    }
  }, [buildQueryParams, mergeFilters, setResults, setSearchParams, setSearching]);

  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      handleSearch(urlQuery);
    } else {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterApply = (appliedFilters) => {
    if (query?.trim()) {
      handleSearch(query);
    } else {
      fetchCourses(appliedFilters);
    }
  };

  const handleVibeSearch = () => {
    openChat();
  };

  const handleDeleteCourse = async (course) => {
    if (!course?.id) return;
    if (!window.confirm(`Delete course "${course.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await coursesApi.delete(course.id);
      await refreshCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadMessage(null);
  };

  const refreshCourses = async () => {
    if (hasSearched && query?.trim()) {
      await handleSearch(query, { silent: true });
    } else {
      await fetchCourses();
    }
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      setUploadMessage({ type: 'error', text: 'Please select at least one PDF.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      if (uploadMode === 'single') {
        const response = await coursesApi.uploadPdf(selectedFiles[0]);
        setUploadMessage({ type: 'success', text: response.message || 'Course created from PDF.' });
      } else {
        const response = await coursesApi.uploadBatch(selectedFiles);
        const summary = response.results
          ?.filter((r) => r.success)
          .map((r) => `• ${r.filename} → ${r.title || 'Untitled course'}`)
          .join('\n');
        setUploadMessage({
          type: 'success',
          text: `Uploaded ${response.successful} of ${response.total} PDFs.${summary ? `\n${summary}` : ''}`,
        });
      }

      setSelectedFiles([]);
      await refreshCourses();
    } catch (error) {
      setUploadMessage({ type: 'error', text: error.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setSelectedFiles([]);
    setUploadMessage(null);
    setUploadMode('single');
  };

  const sectionTitle = hasSearched && query ? `Results for "${query}"` : 'All Courses';
  const sectionDescription = hasSearched
    ? `${courses.length} courses found`
    : `${courses.length} courses available`;
  const showEmptyDiscover = !hasSearched && !courses.length && !isLoading;

  return (
    <PageLayout>
      <PageHeader
        title="Discover & Manage Courses"
        description="Search the catalog or browse everything, and manage listings if you're an admin."
        actions={
          <div className={styles.actionsStack}>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={<Upload size={16} />}
                onClick={() => {
                  resetUploadState();
                  setIsUploadModalOpen(true);
                }}
              >
                Upload Courses
              </Button>
            )}

            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        }
      />

      <div className={styles.searchSection}>
        <SearchBox 
          onSearch={handleSearch}
          placeholder="What would bring you joy today?"
          autoFocus
        />
        
        <div className={styles.vibeSearchPrompt}>
          <span>Or try our</span>
          <Button 
            variant="whimsical" 
            size="sm" 
            icon={<Wand2 size={16} />}
            onClick={handleVibeSearch}
          >
            Vibe Search
          </Button>
          <span>— describe your mood and let AI find the perfect match</span>
        </div>
      </div>

      <div className={styles.filtersSection}>
        <SearchFilters onApply={handleFilterApply} />
      </div>

      {isAdmin && (
        <PageSection
          title="Admin Tools"
          description="Upload PDFs to create courses or manage existing listings"
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={<Upload size={16} />}
              onClick={() => {
                resetUploadState();
                setIsUploadModalOpen(true);
              }}
            >
              Upload PDFs
            </Button>
          }
        >
          <div className={styles.adminBanner}>
            <p>You are signed in as an admin. Course cards include delete buttons only you can see.</p>
          </div>
        </PageSection>
      )}

      {showEmptyDiscover ? (
        <div className={styles.emptyState}>
          <motion.div 
            className={styles.emptyIcon}
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles size={60} />
          </motion.div>
          <h2 className={styles.emptyTitle}>Begin Your Discovery</h2>
          <p className={styles.emptyText}>
            Search for courses by topic, location, or simply describe what you're looking for. 
            Our AI-powered search understands your intent and finds the perfect match.
          </p>
          
          <div className={styles.suggestions}>
            <p className={styles.suggestionsLabel}>Popular searches:</p>
            <div className={styles.suggestionChips}>
              {['Pottery in London', 'Weekend cooking classes', 'Relaxing crafts', 'Creative writing'].map((suggestion) => (
                <button
                  key={suggestion}
                  className={styles.suggestionChip}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <PageSection
          title={sectionTitle}
          description={sectionDescription}
        >
          <CourseGrid 
            courses={courses} 
            columns={viewMode === 'grid' ? 3 : 1} 
            isLoading={isLoading}
            emptyMessage="No courses match your search. Try different keywords or use Vibe Search!"
            isAdmin={isAdmin}
            onDeleteCourse={handleDeleteCourse}
          />
        </PageSection>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload course PDFs"
        description="Upload a single PDF or batch process multiple syllabi to create courses."
        size="lg"
      >
        <form onSubmit={handleUploadSubmit} className={styles.uploadForm}>
          <div className={styles.uploadModeToggle}>
            <label>
              <input
                type="radio"
                name="uploadMode"
                value="single"
                checked={uploadMode === 'single'}
                onChange={() => {
                  setUploadMode('single');
                  setSelectedFiles([]);
                }}
              />
              Single PDF
            </label>
            <label>
              <input
                type="radio"
                name="uploadMode"
                value="batch"
                checked={uploadMode === 'batch'}
                onChange={() => {
                  setUploadMode('batch');
                  setSelectedFiles([]);
                }}
              />
              Batch Upload
            </label>
          </div>

          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>
              Select {uploadMode === 'batch' ? 'PDF files' : 'a PDF file'}
            </label>
            <input
              type="file"
              accept="application/pdf"
              multiple={uploadMode === 'batch'}
              onChange={handleFilesChange}
              disabled={isUploading}
            />
            {selectedFiles.length > 0 && (
              <p className={styles.selectedHint}>
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {uploadMessage && (
            <div
              className={
                uploadMessage.type === 'error'
                  ? styles.uploadError
                  : styles.uploadSuccess
              }
            >
              {uploadMessage.text.split('\n').map((line, idx) => (
                <span key={idx}>{line}</span>
              ))}
            </div>
          )}

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Layers size={16} />}
              isLoading={isUploading}
            >
              {uploadMode === 'batch' ? 'Upload PDFs' : 'Upload PDF'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </PageLayout>
  );
}
