import { graphql } from "react-relay";

export const learningLogItemFragment = graphql`
  fragment learningLogFragments_learningLogItem on LearningLog {
    id
    title
    reflection
    tags
    timeSpent
    sourceUrl
    createdAt
  }
`;

export const LearningLogItemFragment = learningLogItemFragment;
