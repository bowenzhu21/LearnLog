import { graphql } from "react-relay";

export const createLearningLogMutation = graphql`
  mutation createLearningLogMutation($input: CreateLearningLogInput!) {
    createLearningLog(input: $input) {
      log {
        id
        ...learningLogFragments_learningLogItem
      }
    }
  }
`;
