'use client';

import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    name: 'Sarah M.',
    location: 'Newark, NJ',
    rating: 5,
    text: 'VelocityMaid transformed our home! The team was professional, thorough, and left everything spotless. I love coming home to a clean house every week.',
  },
  {
    name: 'Michael R.',
    location: 'Jersey City, NJ',
    rating: 5,
    text: 'As an Airbnb host, I need reliable cleaning between guests. VelocityMaid never disappoints. Fast, efficient, and my guests always comment on how clean the place is.',
  },
  {
    name: 'Jennifer L.',
    location: 'Newark, NJ',
    rating: 5,
    text: 'Best cleaning service I\'ve ever used! They pay attention to every detail and use eco-friendly products. Highly recommend to anyone looking for quality cleaning.',
  },
];

export default function TestimonialsSection({ testimonials = defaultTestimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header with Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-6 py-2 mb-6">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-primary-700 font-bold text-lg">100+ 5-Star Reviews</span>
          </div>
          <h2 className="text-4xl font-bold text-vm-text mb-4">What Our Customers Say</h2>
          <p className="text-xl text-vm-muted">Real feedback from satisfied customers across New Jersey</p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border border-vm-border hover:shadow-xl transition-shadow"
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-vm-text mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Customer Info */}
              <div className="border-t border-vm-border pt-4">
                <p className="font-semibold text-vm-text">{testimonial.name}</p>
                <p className="text-sm text-vm-muted">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

