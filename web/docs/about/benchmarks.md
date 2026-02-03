# Benchmarks

Want to know what kind of performance you can expect from Calagopus? Here are some benchmark results from our testing environment(s), with comparison to Pterodactyl.

## Test Server 1

- **CPU**: AMD EPYC 7443P (4 threads assigned)
- **RAM**: 4GB DDR4 2666MHZ
- **Storage**: RAID 1 NVMe SSDs

### Memory Usage

| Panel         | Idle RAM Usage | High Load RAM Usage |
| ------------- | -------------- | ------------------- |
| Calagopus     | ~150MiB        | ~450MiB             |
| Pterodactyl   | ~296MiB        | ~400MiB             |

Not much to say here, Calagopus uses significantly less memory at idle, and slightly more under high load due to more aggressive caching.

### Response Times

I ran 2 seperate tests using [`oha`](https://github.com/hatoo/oha), each with 500 concurrent connections for 1 minute. The first test targeted the root endpoint `/`, while the second test targeted the `/api/client/permissions` endpoint. Oha was run from a different machine on the same local network with a 10Gbps connection to the test server.

::::tabs
=== Test 1

500 concurrent connections to `/` for 1 minute.

::: code-group
```yml [Calagopus]
# oha -c 500 -z 1m http://192.168.178.53:8000/
Summary:
  Success rate: 100.00%
  Total:        60003.8388 ms
  Slowest:      73.7278 ms
  Fastest:      0.0753 ms
  Average:      9.1649 ms
  Requests/sec: 54538.6939

  Total data:   2.70 GiB
  Size/request: 885 B
  Size/sec:     46.02 MiB

Response time histogram:
   0.075 ms [1]       |
   7.441 ms [1419342] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  14.806 ms [1422133] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  22.171 ms [334597]  |■■■■■■■
  29.536 ms [75308]   |■
  36.902 ms [16819]   |
  44.267 ms [2872]    |
  51.632 ms [743]     |
  58.997 ms [208]     |
  66.363 ms [49]      |
  73.728 ms [21]      |

Response time distribution:
  10.00% in 3.4208 ms
  25.00% in 5.4255 ms
  50.00% in 8.1712 ms
  75.00% in 11.7421 ms
  90.00% in 16.1065 ms
  95.00% in 19.4296 ms
  99.00% in 27.3239 ms
  99.90% in 38.3188 ms
  99.99% in 49.6870 ms


Details (average, fastest, slowest):
  DNS+dialup:   11.0390 ms, 0.3218 ms, 21.0907 ms
  DNS-lookup:   0.0011 ms, 0.0004 ms, 0.0319 ms

Status code distribution:
  [200] 3272093 responses

Error distribution:
  [438] aborted due to deadline
```

```yml [Pterodactyl]
# oha -c 500 -z 1m http://192.168.178.53
Summary:
  Success rate: 100.00%
  Total:        60.0034 sec
  Slowest:      1.8325 sec
  Fastest:      0.0367 sec
  Average:      1.2973 sec
  Requests/sec: 389.3946

  Total data:   16.12 MiB
  Size/request: 739 B
  Size/sec:     275.05 KiB

Response time histogram:
  0.037 sec [1]     |
  0.216 sec [37]    |
  0.396 sec [37]    |
  0.575 sec [40]    |
  0.755 sec [43]    |
  0.935 sec [55]    |
  1.114 sec [54]    |
  1.294 sec [12524] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.473 sec [9157]  |■■■■■■■■■■■■■■■■■■■■■■■
  1.653 sec [783]   |■■
  1.833 sec [135]   |

Response time distribution:
  10.00% in 1.2638 sec
  25.00% in 1.2748 sec
  50.00% in 1.2898 sec
  75.00% in 1.3099 sec
  90.00% in 1.3333 sec
  95.00% in 1.4013 sec
  99.00% in 1.5885 sec
  99.90% in 1.7889 sec
  99.99% in 1.8249 sec


Details (average, fastest, slowest):
  DNS+dialup:   0.0045 sec, 0.0003 sec, 0.0083 sec
  DNS-lookup:   0.0000 sec, 0.0000 sec, 0.0000 sec

Status code distribution:
  [200] 22866 responses

Error distribution:
  [499] aborted due to deadline
```

:::

=== Test 2

500 concurrent connections to `/api/client/permissions` for 1 minute.
::: code-group

```yml [Calagopus]
# oha -c 500 -z 1m http://192.168.178.53:8000/api/client/permissions -H "Authorization: Bearer c7sp_J9SjTBNLYnD43pC8X43CVz7nphoLqHCs6vH1ehsqVNl"
Summary:
  Success rate: 100.00%
  Total:        60003.1351 ms
  Slowest:      111.5004 ms
  Fastest:      0.6788 ms
  Average:      16.4726 ms
  Requests/sec: 30350.6808

  Total data:   140.57 MiB
  Size/request: 80 B
  Size/sec:     2.34 MiB

Response time histogram:
    0.679 ms [1]       |
   11.761 ms [125223]  |■■
   22.843 ms [1593537] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
   33.925 ms [95751]   |■
   45.007 ms [1639]    |
   56.090 ms [1130]    |
   67.172 ms [2561]    |
   78.254 ms [712]     |
   89.336 ms [71]      |
  100.418 ms [51]      |
  111.500 ms [24]      |

Response time distribution:
  10.00% in 12.2877 ms
  25.00% in 13.9148 ms
  50.00% in 15.8884 ms
  75.00% in 18.3135 ms
  90.00% in 21.0755 ms
  95.00% in 23.1809 ms
  99.00% in 28.2464 ms
  99.90% in 61.1721 ms
  99.99% in 75.1722 ms


Details (average, fastest, slowest):
  DNS+dialup:   6.4798 ms, 0.3407 ms, 12.3721 ms
  DNS-lookup:   0.0014 ms, 0.0004 ms, 0.0662 ms

Status code distribution:
  [429] 1816137 responses
  [200] 4563 responses

Error distribution:
  [436] aborted due to deadline
```

```yml [Pterodactyl]
# oha -c 500 -z 1m http://192.168.178.53/api/client/permissions -H "Authorization: Bearer ptlc_tQYHdJvyep0d5KTBmkCSoDgXTbqw5slkvm2iFnTDTUe"
Summary:
  Success rate: 100.00%
  Total:        60.0040 sec
  Slowest:      2.1540 sec
  Fastest:      0.0249 sec
  Average:      1.7020 sec
  Requests/sec: 297.9803

  Total data:   109.33 MiB
  Size/request: 6.44 KiB
  Size/sec:     1.82 MiB

Response time histogram:
  0.025 sec [1]     |
  0.238 sec [53]    |
  0.451 sec [52]    |
  0.664 sec [60]    |
  0.877 sec [59]    |
  1.089 sec [62]    |
  1.302 sec [64]    |
  1.515 sec [63]    |
  1.728 sec [13137] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.941 sec [2349]  |■■■■■
  2.154 sec [1480]  |■■■

Response time distribution:
  10.00% in 1.6494 sec
  25.00% in 1.6651 sec
  50.00% in 1.6851 sec
  75.00% in 1.7225 sec
  90.00% in 1.8120 sec
  95.00% in 2.0609 sec
  99.00% in 2.1217 sec
  99.90% in 2.1453 sec
  99.99% in 2.1539 sec


Details (average, fastest, slowest):
  DNS+dialup:   0.0074 sec, 0.0001 sec, 0.0204 sec
  DNS-lookup:   0.0000 sec, 0.0000 sec, 0.0000 sec

Status code distribution:
  [429] 17126 responses
  [200] 254 responses

Error distribution:
  [500] aborted due to deadline
```

:::
::::

Whats most important here is the average and slowest response times. As you can see, Calagopus is able to handle these requests significantly more efficiently than Pterodactyl, resulting in lower latency and better overall performance. Requests per second is much higher in both tests, however this is not actually that relevant since both panels were able to handle all incoming requests without any errors.

## Test Server 2

- **CPU**: Ampere Altra Q80-30 (4 threads assigned)
- **RAM**: 4GB DDR4 2133MHZ
- **Storage**: RAID 1 NVMe SSDs

### Memory Usage

| Panel         | Idle RAM Usage | High Load RAM Usage |
| ------------- | -------------- | ------------------- |
| Calagopus     | ~150MiB        | ~450MiB             |
| Pterodactyl   | ~296MiB        | ~400MiB             |

Essentially the same as on Test Server 1.

### Response Times

I ran the same 2 tests as on Test Server 1 using [`oha`](https://github.com/hatoo/oha), each with 500 concurrent connections for 1 minute. Oha was run from a different machine on the same local network with a 10Gbps connection to the test server.

::::tabs
=== Test 1

500 concurrent connections to `/` for 1 minute.

::: code-group
```yml [Calagopus]
# oha -c 500 -z 1m http://192.168.178.4:8000/
Summary:
  Success rate: 100.00%
  Total:        60003.1143 ms
  Slowest:      326.7033 ms
  Fastest:      0.1708 ms
  Average:      75.1486 ms
  Requests/sec: 6655.9545

  Total data:   336.66 MiB
  Size/request: 885 B
  Size/sec:     5.61 MiB

Response time histogram:
    0.171 ms [1]      |
   32.824 ms [30181]  |■■■■■■
   65.477 ms [136113] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
   98.131 ms [146622] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  130.784 ms [63574]  |■■■■■■■■■■■■■
  163.437 ms [17724]  |■■■
  196.090 ms [3706]   |
  228.744 ms [766]    |
  261.397 ms [150]    |
  294.050 ms [30]     |
  326.703 ms [15]     |

Response time distribution:
  10.00% in 36.7929 ms
  25.00% in 53.2144 ms
  50.00% in 71.5264 ms
  75.00% in 94.0241 ms
  90.00% in 117.5066 ms
  95.00% in 133.3357 ms
  99.00% in 166.4651 ms
  99.90% in 213.5064 ms
  99.99% in 264.3327 ms


Details (average, fastest, slowest):
  DNS+dialup:   8.7894 ms, 0.2816 ms, 16.6059 ms
  DNS-lookup:   0.0010 ms, 0.0003 ms, 0.0206 ms

Status code distribution:
  [200] 398882 responses

Error distribution:
  [496] aborted due to deadline
```

```yml [Pterodactyl]
# oha -c 500 -z 1m http://192.168.178.177
Summary:
  Success rate: 100.00%
  Total:        60.0036 sec
  Slowest:      2.3796 sec
  Fastest:      0.0415 sec
  Average:      1.9175 sec
  Requests/sec: 264.8842

  Total data:   10.85 MiB
  Size/request: 739 B
  Size/sec:     185.17 KiB

Response time histogram:
  0.041 sec [1]     |
  0.275 sec [35]    |
  0.509 sec [34]    |
  0.743 sec [40]    |
  0.977 sec [51]    |
  1.211 sec [53]    |
  1.444 sec [53]    |
  1.678 sec [51]    |
  1.912 sec [2192]  |■■■■■
  2.146 sec [12745] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  2.380 sec [139]   |

Response time distribution:
  10.00% in 1.9082 sec
  25.00% in 1.9162 sec
  50.00% in 1.9296 sec
  75.00% in 1.9452 sec
  90.00% in 1.9616 sec
  95.00% in 2.0082 sec
  99.00% in 2.1184 sec
  99.90% in 2.3387 sec
  99.99% in 2.3738 sec


Details (average, fastest, slowest):
  DNS+dialup:   0.0096 sec, 0.0004 sec, 0.0183 sec
  DNS-lookup:   0.0000 sec, 0.0000 sec, 0.0000 sec

Status code distribution:
  [200] 15394 responses

Error distribution:
  [500] aborted due to deadline
```

:::

=== Test 2

500 concurrent connections to `/api/client/permissions` for 1 minute.
::: code-group

```yml [Calagopus]
# oha -c 500 -z 1m http://192.168.178.4:8000/api/client/permissions -H "Authorization: Bearer c7sp_igGghMj9heIWeYUU7hAgQyDOVTEqzBFsKg6H35fWzE8"
Summary:
  Success rate: 100.00%
  Total:        60.0036 sec
  Slowest:      4.0932 sec
  Fastest:      0.0006 sec
  Average:      0.2170 sec
  Requests/sec: 2307.9456

  Total data:   25.27 MiB
  Size/request: 192 B
  Size/sec:     431.20 KiB

Response time histogram:
  0.001 sec [1]      |
  0.410 sec [137514] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  0.819 sec [112]    |
  1.228 sec [51]     |
  1.638 sec [51]     |
  2.047 sec [45]     |
  2.456 sec [42]     |
  2.865 sec [41]     |
  3.275 sec [40]     |
  3.684 sec [40]     |
  4.093 sec [48]     |

Response time distribution:
  10.00% in 0.1676 sec
  25.00% in 0.1919 sec
  50.00% in 0.2138 sec
  75.00% in 0.2349 sec
  90.00% in 0.2571 sec
  95.00% in 0.2730 sec
  99.00% in 0.3169 sec
  99.90% in 2.7891 sec
  99.99% in 3.9781 sec


Details (average, fastest, slowest):
  DNS+dialup:   0.0040 sec, 0.0004 sec, 0.0073 sec
  DNS-lookup:   0.0000 sec, 0.0000 sec, 0.0000 sec

Status code distribution:
  [429] 136478 responses
  [200] 1507 responses

Error distribution:
  [500] aborted due to deadline
```

```yml [Pterodactyl]
# oha -c 500 -z 1m http://192.168.178.177/api/client/permissions -H "Authorization: Bearer ptlc_fsc3jLHeCWO3WxMT7NCF9Cg6c97oWDT0aAMzvq3aqko"
Summary:
  Success rate: 100.00%
  Total:        60.0040 sec
  Slowest:      2.8156 sec
  Fastest:      0.2462 sec
  Average:      2.5040 sec
  Requests/sec: 203.4366

  Total data:   73.71 MiB
  Size/request: 6.45 KiB
  Size/sec:     1.23 MiB

Response time histogram:
  0.246 sec [1]    |
  0.503 sec [44]   |
  0.760 sec [58]   |
  1.017 sec [50]   |
  1.274 sec [50]   |
  1.531 sec [71]   |
  1.788 sec [50]   |
  2.045 sec [32]   |
  2.302 sec [50]   |
  2.559 sec [8587] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  2.816 sec [2714] |■■■■■■■■■■

Response time distribution:
  10.00% in 2.5156 sec
  25.00% in 2.5269 sec
  50.00% in 2.5415 sec
  75.00% in 2.5572 sec
  90.00% in 2.5792 sec
  95.00% in 2.6180 sec
  99.00% in 2.6872 sec
  99.90% in 2.7151 sec
  99.99% in 2.7966 sec


Details (average, fastest, slowest):
  DNS+dialup:   0.1115 sec, 0.0003 sec, 0.2152 sec
  DNS-lookup:   0.0000 sec, 0.0000 sec, 0.0000 sec

Status code distribution:
  [429] 11578 responses
  [200] 129 responses

Error distribution:
  [500] aborted due to deadline
```

:::
::::

While we have a similar outcome on this test server, the performance difference is not as pronounced as on Test Server 1. This is likely due to the overall lower performance of the Ampere Altra CPU in single-threaded tasks compared to the AMD EPYC CPU. However, Calagopus still demonstrates significantly better performance in both tests compared to Pterodactyl.


## Conclusion

From the benchmark results on both test servers, it's evident that Calagopus outperforms Pterodactyl in terms of memory usage and response times under load. Calagopus consistently uses less memory at idle and maintains competitive memory usage under high load. More importantly, Calagopus exhibits significantly lower average and slowest response times in both tests, indicating better efficiency and performance in handling requests. These results highlight Calagopus as a more optimized solution for managing game servers compared to Pterodactyl.
