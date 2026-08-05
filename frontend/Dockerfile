FROM php:8.3-apache
RUN a2enmod proxy proxy_http headers && mkdir -p /etc/apache2/custom && echo "Include /etc/apache2/custom/apache.conf" >> /etc/apache2/apache2.conf
COPY apache.conf /etc/apache2/custom/apache.conf
COPY public/ /var/www/html/
