# 3. Choose ULID as identifier format

Date: 2022-06-16

## Status

Accepted

## Context

Each project entity must have a unique identifier, which allows
to distinguish one entity from another. It is therefore necessary to determine the format to be used for the identifiers.

The following properties must be respected by the format in order for it to be suitable for our needs.

1.  Must be unpredictable
2.  Must be able to be ordered
3.  It must be URL-friendly, as some REST endpoint use it as a path parameter.
4.  It must be able to be generated at runtime without the use of any additional baking services.

To choose it, we compared several different alternative formats by placing them in relation to the required properties

| Property    | Numeric ID         | UUIDv4             | [ulid](https://github.com/ulid/spec) | [xid](https://github.com/rs/xid) | snowflake-like     |
| ----------- | ------------------ | ------------------ | ------------------------------------ | -------------------------------- | ------------------ |
| Property #1 | :x:                | :white_check_mark: | :white_check_mark:                   | :x:                              | :white_check_mark: |
| Property #2 | :white_check_mark: | :x:                | :white_check_mark:                   | :white_check_mark:               | :white_check_mark: |
| Property #4 | :white_check_mark: | :white_check_mark: | :white_check_mark:                   | :white_check_mark:               | :white_check_mark: |
| Property #3 | :x:                | :white_check_mark: | :white_check_mark:                   | :white_check_mark:               | :x:                |

_Note: There are various variants for each format compared that, while maintaining the same structure, change the size reserved for each component (to reduce potential collisions, support larger timestamps or adapt to certain needs in terms of space or compatibility). [ksuid](https://github.com/segmentio/ksuid), which has the same structure as `ulid`, is an example. In this scenario, we chose libraries with superior JavaScript support and that better fit our requirements._

## Decision

The format of identification that best suits our needs, as evidenced by the comparison, is `ulid`.
