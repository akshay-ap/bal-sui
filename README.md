# bal-sui

## Obtain gas token

```bash
# Check current account's gas token balances
sui client gas
sui client transfer-sui --amount 1000000 --to 0xa7d262f7599441aef3499d7f6b5b69ef35610259 --sui-coin-object-id 0x8344b53a784e9afa0d01f95d4c11ed746d7c6eee --gas-budget 1000

# Check desiered account's gas token balances
sui client gas 0xa7d262f7599441aef3499d7f6b5b69ef35610259
```
