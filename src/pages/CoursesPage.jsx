import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Grid, List, Upload, Layers } from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '../components/layout';
import { SearchFilters } from '../components/search';
import { CourseGrid } from '../components/courses';
import { Button, Modal, ModalFooter } from '../components/ui';
import { useUserStore } from '../stores/useStore';
import { coursesApi } from '../services/api';
import styles from './CoursesPage.module.css';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState('single');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const user = useUserStore((state) => state.user);
  const isAdmin = Boolean(user?.email?.endsWith('@dandori.com'));

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (filters = {}) => {
    setIsLoading(true);
    try {
      const data = await coursesApi.getAll(filters);
      setCourses(data.courses || data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = (filters) => {
    fetchCourses({
      location: filters.location,
      course_type: filters.courseType,
      min_price: filters.priceRange?.[0],
      max_price: filters.priceRange?.[1],
      sort_by: filters.sortBy,
    });
  };

  const handleDeleteCourse = async (course) => {
    if (!course?.id) return;
    if (!window.confirm(`Delete course "${course.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await coursesApi.delete(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
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
        setUploadMessage({
          type: 'success',
          text: `Uploaded ${response.successful} of ${response.total} PDFs.
${response.results
  ?.filter((r) => r.success)
  .map((r) => `• ${r.filename} → ${r.title || 'Untitled course'}`)
  .join('\n') || ''}`.trim(),
        });
      }

      setSelectedFiles([]);
      await fetchCourses();
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

  return (
    <PageLayout>
      <PageHeader
        title="All Courses"
        description="Explore our complete collection of whimsical courses designed to nurture your wellbeing"
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

      <PageSection>
        <CourseGrid 
          courses={courses} 
          columns={viewMode === 'grid' ? 3 : 1} 
          isLoading={isLoading}
          emptyMessage="No courses available at the moment. Check back soon!"
          isAdmin={isAdmin}
          onDeleteCourse={handleDeleteCourse}
        />
      </PageSection>

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
              onClick={() => {
                setIsUploadModalOpen(false);
              }}
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
