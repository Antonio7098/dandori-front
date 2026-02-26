import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Palette, Type, Layers, ImageIcon } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Rating } from '../components/ui';
import { SearchBox } from '../components/search';
import CourseCard from '../components/courses/CourseCard';
import styles from './VisualElementsPage.module.css';

const colorPalette = [
  { name: 'Forest', token: '--color-forest-500' },
  { name: 'Terracotta', token: '--color-terracotta-500' },
  { name: 'Honey', token: '--color-honey-400' },
  { name: 'Sage', token: '--color-sage-400' },
  { name: 'Cream', token: '--color-cream-200' },
];

const sampleCourses = [
  {
    id: 'sample-1',
    title: 'Mystical Moss Mastery',
    instructor: 'Professor Lichenbottom',
    description: 'Craft miniature moss landscapes and learn mindful botanical rituals.',
    course_type: 'Nature Crafts',
    location: 'Peak District',
    cost: '£145',
    rating: 4.9,
    reviews_count: 128,
    image_url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    is_new: true,
  },
  {
    id: 'sample-2',
    title: 'Moonlit Patisserie Poetry',
    instructor: 'Saffron Delacroix',
    description: 'Blend pastry technique with spoken word under the soft glow of candlelight.',
    course_type: 'Culinary Arts',
    location: 'Bath',
    cost: '£175',
    rating: 4.7,
    reviews_count: 89,
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80',
  },
];

const typographySamples = [
  { label: 'Display', tag: 'h1', text: 'The School of Dandori' },
  { label: 'Headline', tag: 'h2', text: 'Rediscover playful wellbeing' },
  { label: 'Body', tag: 'p', text: 'Evening and weekend classes crafted to restore wonder, balance, and creative courage.' },
];

const buttonShowcase = [
  { label: 'Primary', props: { children: 'Explore Courses' } },
  { label: 'Whimsical', props: { children: 'Start Chat', variant: 'whimsical', icon: <Sparkles size={16} /> } },
  { label: 'Outline', props: { children: 'View Schedule', variant: 'outline' } },
];

export default function VisualElementsPage() {
  return (
    <div className={styles.page}>
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.heroPattern} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Visual toolkit</p>
          <h1>Visual Elements Library</h1>
          <p>
            Scroll this full-bleed canvas to capture every key element for your presentation—typography, palette,
            interactions, and hero visuals are laid out in one place.
          </p>
          <div className={styles.heroActions}>
            <Button as={Link} to="/home" variant="whimsical" icon={<Sparkles size={18} />}>Back to Home</Button>
            <Button variant="outline" as={Link} to="/search">Open Search</Button>
          </div>
        </div>
        <div className={styles.heroStats}>
          {[
            { icon: Palette, label: 'Palette Tokens', value: '40+' },
            { icon: Type, label: 'Typography Styles', value: '12' },
            { icon: Layers, label: 'Components', value: '60+' },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} variant="whimsical" className={styles.statCard}>
              <CardContent>
                <Icon size={20} />
                <span className={styles.statLabel}>{label}</span>
                <strong>{value}</strong>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Color Language</h2>
          <p>Core swatches pull directly from CSS custom properties for absolute parity with production UI.</p>
        </header>
        <div className={styles.paletteGrid}>
          {colorPalette.map((color) => (
            <div key={color.token} className={styles.paletteCard}>
              <div className={styles.swatch} style={{ background: `var(${color.token})` }} />
              <div className={styles.swatchInfo}>
                <span>{color.name}</span>
                <code>{color.token}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Typography</h2>
          <p>Fraunces handles display work while Crimson Pro keeps body copy warm and readable.</p>
        </header>
        <div className={styles.typographyGrid}>
          {typographySamples.map(({ label, tag: Tag, text }) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>{label === 'Body' ? 'Paragraph / supporting copy' : 'Display hierarchy'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tag className={styles.typographySample}>{text}</Tag>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Buttons & Badges</h2>
          <p>Interactive states retain motion easing from production components.</p>
        </header>
        <div className={styles.buttonsGrid}>
          {buttonShowcase.map(({ label, props }) => (
            <div key={label} className={styles.buttonCard}>
              <span>{label}</span>
              <Button {...props} />
            </div>
          ))}
          <div className={styles.badgeStack}>
            <span>Badges</span>
            <div className={styles.badges}>
              <Badge variant="primary">Nature Crafts</Badge>
              <Badge variant="accent">New</Badge>
              <Badge variant="subtle">Weekend</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Search & Inputs</h2>
          <p>Hero search box demonstrates focus rings, floating decorations, and CTA alignment.</p>
        </header>
        <div className={styles.searchDemo}>
          <SearchBox variant="hero" placeholder="Try ‘mindful ceramics’" onSearch={() => {}} />
        </div>
      </section>

      <section className={`${styles.section} ${styles.cardsSection}`}>
        <header className={styles.sectionHeader}>
          <h2>Card System</h2>
          <p>Full course cards render with live rating, location, and admin controls.</p>
        </header>
        <div className={styles.cardShowcase}>
          {sampleCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        <Card variant="whimsical" className={styles.detailCard}>
          <CardHeader>
            <div className={styles.detailHeader}>
              <ImageIcon size={20} />
              <div>
                <CardTitle>Detail Elements</CardTitle>
                <CardDescription>Micro interactions captured for reference</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={styles.detailContent}>
            <div>
              <h4>Rating Capsule</h4>
              <div className={styles.ratingCapsule}>
                <Rating value={4.9} size="sm" />
                <span>4.9 · Loved by 120 learners</span>
              </div>
            </div>
            <div>
              <h4>Meta Chips</h4>
              <div className={styles.metaChips}>
                <Badge variant="primary">Peak District</Badge>
                <Badge variant="accent">Weekend</Badge>
                <Badge variant="subtle">Level: Gentle</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
