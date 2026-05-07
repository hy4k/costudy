
import { User, Mentor, StudyRoom } from '../types';

export interface MatchResult<T> {
  item: T;
  score: number;
  reasons: string[];
}

export const matchMentorForStudent = (student: User, mentors: Mentor[]): MatchResult<Mentor>[] => {
  // Defensive check for empty performance data
  if (!student.performance || student.performance.length === 0) {
    return mentors.map(mentor => ({ item: mentor, score: 0, reasons: [] }));
  }

  const weakTopic = [...student.performance].sort((a, b) => a.score - b.score)[0];
  
  return mentors.map(mentor => {
    let score = 0;
    const reasons: string[] = [];

    // Specialty Match
    if (weakTopic && mentor.specialties.some(s => s.toLowerCase().includes(weakTopic.topic.toLowerCase()))) {
      score += 40;
      reasons.push(`Expertise in your weak area: ${weakTopic.topic}`);
    }

    // Learning Style Match
    if (mentor.learningStyle.includes(student.learningStyle)) {
      score += 30;
      reasons.push(`Matches your ${student.learningStyle} learning style`);
    }

    // Timezone Match
    if (mentor.timezone === student.timezone) {
      score += 20;
      reasons.push(`Same timezone (${student.timezone})`);
    }

    // Budget check (assuming Doubt Resolution price is the proxy)
    const doubtPrice = mentor.offerings.find(o => o.type === 'Doubt')?.price || 9999;
    if (student.budget && doubtPrice <= student.budget) {
      score += 10;
      reasons.push(`Within your ₹${student.budget} budget`);
    }

    return { item: mentor, score, reasons };
  }).sort((a, b) => b.score - a.score);
};

export const matchRoomsForStudent = (student: User, rooms: StudyRoom[]): MatchResult<StudyRoom>[] => {
  // Defensive check for empty performance data
  if (!student.performance || student.performance.length === 0) {
    return [];
  }

  const weakTopic = [...student.performance].sort((a, b) => a.score - b.score)[0];

  return rooms.map(room => {
    let score = 0;
    const reasons: string[] = [];

    if (weakTopic && room.targetTopics.some(t => t.toLowerCase().includes(weakTopic.topic.toLowerCase()))) {
      score += 50;
      reasons.push(`Focused on ${weakTopic.topic}`);
    }

    if (student.availableHours === 'Evening' && room.name.toLowerCase().includes('evening')) {
      score += 30;
      reasons.push('Matches your evening availability');
    }

    return { item: room, score, reasons };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
};
