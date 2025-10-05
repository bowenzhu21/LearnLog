import { graphql } from "react-relay";

export const deleteLearningLogMutation = graphql`
  mutation deleteLearningLogMutation($input: DeleteLearningLogInput!) {
    deleteLearningLog(input: $input) {
      deletedId
    }
  }
`;
