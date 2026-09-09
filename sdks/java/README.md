# jikida (Java / Spring)

Fail-open Jikida servlet filter.

## Install

```gradle
implementation "io.jikida:jikida:0.2.0"
```

or Maven:

```xml
<dependency>
    <groupId>io.jikida</groupId>
    <artifactId>sdk</artifactId>
    <version>0.1.0</version>
</dependency>
```

## Use — Spring Boot

```java
@Bean
public JikidaFilter jikida() {
    return new JikidaFilter(System.getenv("JIKIDA_TOKEN"));
}
```

## Status

Scaffold — this SDK currently passes every request through and does not yet inspect, block, cache policy, or forward attack logs. For working protection today use the CNAME edge (point your domain at guard.jikida.io — full WAF, no code) or the Node/PHP SDKs.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-java)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
