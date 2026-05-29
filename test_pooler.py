import psycopg2

regions = [
    'ap-south-1',       # Mumbai
    'ap-southeast-1',   # Singapore
    'ap-northeast-1',   # Tokyo
    'ap-northeast-2',   # Seoul
    'ap-southeast-2',   # Sydney
    'us-east-1',        # N. Virginia
    'us-east-2',        # Ohio
    'us-west-1',        # N. California
    'us-west-2',        # Oregon
    'eu-central-1',     # Frankfurt
    'eu-west-1',        # Ireland
    'eu-west-2',        # London
    'eu-west-3',        # Paris
    'sa-east-1'         # Sao Paulo
]

print("Starting Supabase region discovery scan...")
for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    try:
        # Try to establish connection with a short timeout to be fast
        conn = psycopg2.connect(
            host=host,
            database="postgres",
            user="postgres.yuykuslohgihoeuauidq",
            password="Aritra@2001#",
            port=6543,
            connect_timeout=3
        )
        print(f"SUCCESS! Your correct Supabase Pooler Host is: {host}")
        conn.close()
        break
    except Exception as e:
        err_msg = str(e).strip()
        if "tenant/user" in err_msg and "not found" in err_msg:
            # Server reached but tenant not found here (wrong region)
            print(f"{r}: Reached but tenant not found.")
        elif "timeout expired" in err_msg or "Network is unreachable" in err_msg:
            print(f"{r}: Timeout/Unreachable.")
        else:
            print(f"{r}: {err_msg}")
print("Discovery scan complete.")
