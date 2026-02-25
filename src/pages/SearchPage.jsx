import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wand2 } from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '../components/layout';
import { SearchBox, SearchFilters } from '../components/search';
import { CourseGrid } from '../components/courses';
import { Button } from '../components/ui';
import { useSearchStore, useChatStore } from '../stores/useStore';
import { coursesApi } from '../services/api';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { query, setQuery, filters, setSearching, setResults } = useSearchStore();
  const { openChat } = useChatStore();

  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      handleSearch(urlQuery);
    }
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery?.trim()) return;
    
    setIsLoading(true);
    setSearching(true);
    setHasSearched(true);
    
    try {
      const response = await coursesApi.graphSearch(searchQuery, {
        location: filters.location,
        course_type: filters.courseType,
        min_price: filters.priceRange[0],
        max_price: filters.priceRange[1],
        sort_by: filters.sortBy,
      });
      
      const results = response.results || response.courses || response || [];
      setCourses(results);
      setResults(results);
      
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error('Search failed:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
      setSearching(false);
    }
  };

  const handleFilterApply = (appliedFilters) => {
    if (query) {
      handleSearch(query);
    }
  };

  const handleVibeSearch = () => {
    openChat();
  };

  return (
    <PageLayout>
      <PageHeader
        title="Discover Your Joy"
        description="Search through hundreds of whimsical courses designed to nurture your wellbeing"
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

      {!hasSearched ? (
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
          title={query ? `Results for "${query}"` : 'All Courses'}
          description={`${courses.length} courses found`}
        >
          <CourseGrid 
            courses={courses} 
            columns={3} 
            isLoading={isLoading}
            emptyMessage="No courses match your search. Try different keywords or use Vibe Search!"
          />
        </PageSection>
      )}
    </PageLayout>
  );
}
