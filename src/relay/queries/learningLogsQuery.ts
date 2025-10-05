import { graphql } from "react-relay";

export const learningLogsQuery = graphql`
  query learningLogsQuery($first: Int!, $filter: LearningLogFilter) {
    ...LogsView_query @arguments(first: $first, filter: $filter)
  }
`;
