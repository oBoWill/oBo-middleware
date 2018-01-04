/**
 * Created by rj on 10/05/17.
 */

export const getTenantHost = (tun) => {
  const portStr = [443, 80, '443', '80'].indexOf(process.env.CLIENT_PORT) >= 0 ? '' : `:${process.env.CLIENT_PORT}`;
  return process.env.CLIENT_DOMAIN_NAME && `${tun}.${process.env.CLIENT_DOMAIN_NAME}${portStr}`;
};
