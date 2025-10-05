import { graphql } from "react-relay";

export const updateLearningLogMutation = graphql`
  mutation updateLearningLogMutation($input: UpdateLearningLogInput!) {
    updateLearningLog(input: $input) {
      log {
        id
        ...learningLogFragments_learningLogItem
      }
    }
  }
`;
